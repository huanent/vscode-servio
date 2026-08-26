import * as vscode from 'vscode';
import { SshServer } from '../servers/server';
import { ServerStore } from '../servers/serverStore';
import { executeSshCommand } from '../ssh/sshCommand';

interface EmptyInput {}

interface ExecuteSshCommandInput {
	serverId: string;
	command: string;
}

export function registerServerHubTools(serverStore: ServerStore): vscode.Disposable {
	return vscode.Disposable.from(
		vscode.lm.registerTool('serverhub_list_ssh_servers', new ListSshServersTool(serverStore)),
		vscode.lm.registerTool('serverhub_execute_ssh_command', new ExecuteSshCommandTool(serverStore)),
	);
}

class ListSshServersTool implements vscode.LanguageModelTool<EmptyInput> {
	constructor(private readonly serverStore: ServerStore) {}

	async invoke(
		_options: vscode.LanguageModelToolInvocationOptions<EmptyInput>,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelToolResult> {
		const servers = this.serverStore.getServers()
			.filter((server): server is SshServer => server.type === 'ssh')
			.map(server => ({
				id: server.id,
				name: server.name,
				host: server.host,
				port: server.port,
				username: server.username,
				group: server.group,
			}));

		return textResult(JSON.stringify(servers, undefined, 2));
	}
}

class ExecuteSshCommandTool implements vscode.LanguageModelTool<ExecuteSshCommandInput> {
	constructor(private readonly serverStore: ServerStore) {}

	prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<ExecuteSshCommandInput>,
	): vscode.PreparedToolInvocation {
		const server = this.findSshServer(options.input.serverId);
		const target = server ? `${server.name} (${server.username}@${server.host}:${server.port})` : options.input.serverId;
		return {
			invocationMessage: `Executing SSH command on ${target}`,
			confirmationMessages: {
				title: 'Allow SSH command?',
				message: new vscode.MarkdownString(
					`Run \`${options.input.command}\` on **${target}**?`,
				),
			},
		};
	}

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<ExecuteSshCommandInput>,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelToolResult> {
		const server = this.findSshServer(options.input.serverId);
		if (!server) {
			throw new Error('SSH server was not found. Call serverhub_list_ssh_servers first.');
		}

		const credentials = await this.serverStore.getCredentials(server.id);
		const output = await executeSshCommand(server, credentials, options.input.command);
		return textResult(output.slice(0, 20_000));
	}

	private findSshServer(serverId: string): SshServer | undefined {
		return this.serverStore.getServers().find(
			(server): server is SshServer => server.id === serverId && server.type === 'ssh',
		);
	}
}

function textResult(value: string): vscode.LanguageModelToolResult {
	return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(value)]);
}