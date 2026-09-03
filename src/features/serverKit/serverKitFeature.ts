import * as vscode from 'vscode';
import { registerServerCommands } from '../../commands';
import { registerServerKitEditor } from '../../editors/serverKitEditor';
import { MysqlSqlEditorController } from '../../mysql/mysqlSqlEditor';
import { ServerStore } from '../../servers/serverStore';
import { ServerTreeDataProvider } from '../../servers/serverTree';
import { registerServerKitTools } from '../../tools/serverKitTools';

export async function activateServerKitFeature(context: vscode.ExtensionContext): Promise<void> {
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
		registerServerKitTools(serverStore),
		registerServerKitEditor(
			context,
			serverStore,
			(serverId, database, initialSql) => void mysqlSqlEditor.open(serverId, database, initialSql),
		),
		registerServerCommands(serverStore, treeDataProvider, treeView),
		treeView,
	);
}