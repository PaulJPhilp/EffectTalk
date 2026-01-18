import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import type { Session } from "../types/session.js";
import { BlockContent } from "./BlockContent.js";

export interface VirtualBlockListProps {
	readonly session: Session;
	readonly height?: number;
}

export const VirtualBlockList: React.FC<VirtualBlockListProps> = ({
	session,
	height = 20,
}) => {
	// Simple virtualization: Render a window around the focused block
	// If no focus, render the last N blocks (tailing)

	const focusedIndex = session.blocks.findIndex(
		(b) => b.id === session.focusedBlockId,
	);
	const totalBlocks = session.blocks.length;

	// If focused, center around focus. If not, show last `height` blocks.
	let startIndex = 0;
	let endIndex = totalBlocks;

	if (focusedIndex !== -1) {
		// Attempt to center the focused block
		const halfWindow = Math.floor(height / 2);
		startIndex = Math.max(0, focusedIndex - halfWindow);
		endIndex = Math.min(totalBlocks, startIndex + height);

		// Adjust start if we hit the end
		if (endIndex - startIndex < height) {
			startIndex = Math.max(0, endIndex - height);
		}
	} else {
		// Tail mode
		startIndex = Math.max(0, totalBlocks - height);
	}

	const visibleBlocks = session.blocks.slice(startIndex, endIndex);

	return (
		<Box flexDirection="column" flexGrow={1}>
			{startIndex > 0 && (
				<Box borderStyle="single" borderColor="gray" paddingX={1}>
					<Text dimColor>... {startIndex} earlier blocks ...</Text>
				</Box>
			)}

			{visibleBlocks.map((block) => {
				const isFocused = block.id === session.focusedBlockId;
				return (
					<Box
						key={block.id}
						flexDirection="column"
						marginBottom={1}
						borderStyle={isFocused ? "double" : "single"}
						borderColor={isFocused ? "cyan" : "gray"}
						paddingX={1}
					>
						<Box>
							<Text bold>[{block.status.toUpperCase()}]</Text>
							<Text color="yellow"> {block.command}</Text>
							{isFocused && (
								<Text color="cyan" bold>
									{" "}
									(FOCUSED)
								</Text>
							)}
						</Box>
						<BlockContent block={block} />
					</Box>
				);
			})}

			{endIndex < totalBlocks && (
				<Box borderStyle="single" borderColor="gray" paddingX={1}>
					<Text dimColor>... {totalBlocks - endIndex} more blocks ...</Text>
				</Box>
			)}
		</Box>
	);
};
