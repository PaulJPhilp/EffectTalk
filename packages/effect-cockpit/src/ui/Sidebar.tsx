import React from "react";
import { Box, Text } from "ink";
import type { Session } from "../types/session.js";

export interface SidebarProps {
	readonly session: Session;
}

export const Sidebar: React.FC<SidebarProps> = ({ session }) => {
	const envCount = Object.keys(session.environment).length;

	return (
		<Box
			flexDirection="column"
			width={30}
			borderStyle="single"
			borderTop={false}
			borderBottom={false}
			borderLeft={false}
			borderRight={true}
			paddingX={1}
		>
			<Box marginBottom={1}>
				<Text bold underline>
					Workspace
				</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text color="gray">Directory:</Text>
				<Text>{session.workingDirectory}</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text color="gray">Environment:</Text>
				<Text>{envCount} variables</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text color="gray">Blocks:</Text>
				<Text>Total: {session.blocks.length}</Text>
				<Text>
					Active: {session.blocks.filter((b) => b.status === "running").length}
				</Text>
			</Box>
		</Box>
	);
};
