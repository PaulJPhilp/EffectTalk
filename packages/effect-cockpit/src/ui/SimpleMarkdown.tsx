import { Box, Text } from "ink";
import type React from "react";

export const SimpleMarkdown: React.FC<{ children: string }> = ({
	children,
}) => {
	const lines = children.split("\n");

	return (
		<Box flexDirection="column">
			{lines.map((line, i) => {
				// Headers
				if (line.startsWith("# ")) {
					return (
						<Box key={i} marginTop={1} marginBottom={1}>
							<Text bold underline color="blue">
								{line.replace("# ", "")}
							</Text>
						</Box>
					);
				}

				// List items
				if (line.trim().startsWith("- ")) {
					return (
						<Box key={i} paddingLeft={1}>
							<Text color="green">• </Text>
							<InlineMarkdown text={line.trim().substring(2)} />
						</Box>
					);
				}

				// Empty lines
				if (line.trim() === "") {
					return <Box key={i} height={1} />;
				}

				// Normal text
				return (
					<Box key={i}>
						<InlineMarkdown text={line} />
					</Box>
				);
			})}
		</Box>
	);
};

const InlineMarkdown: React.FC<{ text: string }> = ({ text }) => {
	// Split by bold markers (**)
	const parts = text.split(/(\**.*?\**)/g);

	return (
		<Text>
			{parts.map((part, index) => {
				if (part.startsWith("**") && part.endsWith("**")) {
					return (
						<Text key={index} bold color="cyan">
							{part.slice(2, -2)}
						</Text>
					);
				}
				if (part.startsWith("`") && part.endsWith("`")) {
					return (
						<Text key={index} backgroundColor="gray" color="white">
							{part}
						</Text>
					);
				}
				return <Text key={index}>{part}</Text>;
			})}
		</Text>
	);
};
