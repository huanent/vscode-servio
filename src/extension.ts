import * as vscode from 'vscode';
import { activateServerKitFeature } from './features/serverKit/serverKitFeature';
import { initializeSftpFileEditing } from './ssh/sshTerminal';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	await initializeSftpFileEditing(context);
	await activateServerKitFeature(context);
}

export function deactivate(): void {}
