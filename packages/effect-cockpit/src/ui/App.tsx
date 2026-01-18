import { Effect } from "effect";
import { Box, Text, useInput } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import type { Session } from "../types/session.js";
import { MultiLineInput } from "./MultiLineInput.js";
import { Sidebar } from "./Sidebar.js";
import { VirtualBlockList } from "./VirtualBlockList.js";

export interface AppProps {
	readonly session: Session;
	readonly slashCommands: ReadonlyArray<{ name: string; description: string }>;
	readonly onExecute: (command: string) => void;
	readonly onFocusNext: () => void;
	readonly onFocusPrev: () => void;
}

export const App: React.FC<AppProps> = ({
	session,
	slashCommands,
	onExecute,
	onFocusNext,
	onFocusPrev,
}) => {
	const [showSidebar, setShowSidebar] = useState(true);

	useInput((input, key) => {
		// Basic navigation
		if (key.upArrow && key.shift) {
			onFocusPrev();
		}
		if (key.downArrow && key.shift) {
			onFocusNext();
		}
		// Toggle Sidebar: Ctrl+B
		if (input === "b" && key.ctrl) {
			setShowSidebar(!showSidebar);
		}
	});

	return (
		<Box flexDirection="column" height="100%">
			<Box borderStyle="round" paddingX={1}>
				<Text bold color="cyan">
					Effect Cockpit - Session: {session.id}
				</Text>
			</Box>

			<Box flexDirection="row" flexGrow={1} overflowY="hidden">
				{showSidebar && <Sidebar session={session} />}

				<Box flexDirection="column" flexGrow={1} paddingX={1}>
					{session.blocks.length === 0 ? (
						<Box height={1}>
							<Text italic color="gray">
								No blocks yet. Type a command below.
							</Text>
						</Box>
					) : (
						<VirtualBlockList session={session} />
					)}
				</Box>
			</Box>

			<Box flexDirection="column" marginTop={1}>
				<Box paddingX={1}>
					<Text dimColor>
						WD: {session.workingDirectory} | Shift+Up/Down: Nav | Ctrl+B: Toggle
						Sidebar
					</Text>
				</Box>
				<MultiLineInput onSubmit={onExecute} suggestions={slashCommands} />
			</Box>
		</Box>
	);
};
