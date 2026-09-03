import * as vscode from 'vscode';
import { registerServerCommands } from '../../commands';
import { registerServerkitEditor } from '../../editors/serverkitEditor';
import { MysqlSqlEditorController } from '../../mysql/mysqlSqlEditor';
import { ServerStore } from '../../servers/serverStore';
import { ServerTreeDataProvider } from '../../servers/serverTree';
import { registerServerkitTools } from '../../tools/serverkitTools';

export async function activateServerkitFeature(context: vscode.ExtensionContext): Promise<void> {
	const serverStore = await ServerStore.create(context);
	const treeDataProvider = new ServerTreeDataProvider(serverStore);
	const treeView = vscode.window.createTreeView('serverkit.servers', {
		treeDataProvider,
		canSelectMany: true,
		showCollapseAll: true,
	});
	const mysqlSqlEditor = new MysqlSqlEditorController(context, serverStore);

	context.subscriptions.push(
		serverStore,
		treeDataProvider,
		mysqlSqlEditor,
		registerServerkitTools(serverStore),
		registerServerkitEditor(
			context,
			serverStore,
			(serverId, database, initialSql) => void mysqlSqlEditor.open(serverId, database, initialSql),
		),
		registerServerCommands(serverStore, treeDataProvider, treeView),
		treeView,
	);
}