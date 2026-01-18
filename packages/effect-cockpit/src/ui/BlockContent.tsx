import { Box, Text } from "ink";
import type React from "react";
import type { Block } from "../types/block.js";
import { SimpleMarkdown } from "./SimpleMarkdown.js";

export interface BlockContentProps {
	readonly block: Block;
}

export const BlockContent: React.FC<BlockContentProps> = ({ block }) => {
	// Simple heuristic to detect if content might be markdown
	// In a real app, we might check for a specific header or metadata
	const isMarkdown =
		block.command.includes("help") ||
		block.command.includes("welcome") ||
		block.command.includes("readme") ||
		block.stdout.includes("# ");

	return (
		<Box flexDirection="column" paddingLeft={1}>
			{block.stdout && (
				<Box flexDirection="column">
					{isMarkdown ? (
						<SimpleMarkdown>{block.stdout}</SimpleMarkdown>
					) : (
						<Text>{block.stdout}</Text>
					)}
				</Box>
			)}
			{block.stderr && (
				<Box flexDirection="column" marginTop={block.stdout ? 1 : 0}>
					<Text color="red">{block.stderr}</Text>
				</Box>
			)}
		</Box>
	);
};
