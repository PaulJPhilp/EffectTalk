import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

export interface MultiLineInputProps {
	readonly onSubmit: (value: string) => void;
	readonly placeholder?: string;
	readonly suggestions?: ReadonlyArray<{ name: string; description: string }>;
}

export const MultiLineInput: React.FC<MultiLineInputProps> = ({
	onSubmit,
	placeholder = "Type a command...",
	suggestions = [],
}) => {
	const [value, setValue] = useState("");
	const [cursor, setCursor] = useState(0);

	const isSlash = value.startsWith("/");
	const slashTerm = isSlash
		? value.slice(1).split(/\s+/)[0]?.toLowerCase() || ""
		: "";
	const matchingSuggestions = isSlash
		? suggestions.filter((s) => s.name.toLowerCase().startsWith(slashTerm))
		: [];

	useInput((input, key) => {
		if (key.return) {
			if (key.shift) {
				// Insert newline
				const newValue = value.slice(0, cursor) + "\n" + value.slice(cursor);
				setValue(newValue);
				setCursor(cursor + 1);
			} else {
				// Submit
				if (value.trim()) {
					onSubmit(value);
					setValue("");
					setCursor(0);
				}
			}
			return;
		}

		if (key.backspace || key.delete) {
			if (cursor > 0) {
				const newValue = value.slice(0, cursor - 1) + value.slice(cursor);
				setValue(newValue);
				setCursor(cursor - 1);
			}
			return;
		}

		if (key.leftArrow) {
			setCursor(Math.max(0, cursor - 1));
			return;
		}

		if (key.rightArrow) {
			setCursor(Math.min(value.length, cursor + 1));
			return;
		}

		if (key.tab && isSlash && matchingSuggestions.length > 0) {
			const top = matchingSuggestions[0];
			if (top) {
				const newValue = "/" + top.name + " ";
				setValue(newValue);
				setCursor(newValue.length);
			}
			return;
		}

		// Handle regular character input
		if (input && !key.ctrl && !key.meta) {
			const newValue = value.slice(0, cursor) + input + value.slice(cursor);
			setValue(newValue);
			setCursor(cursor + input.length);
		}
	});

	const renderValue = () => {
		if (value.length === 0) {
			return <Text dimColor>{placeholder}</Text>;
		}

		const before = value.slice(0, cursor);
		const charAtCursor = value[cursor] || " ";
		const after = value.slice(cursor + 1);

		return (
			<Text>
				{before}
				<Text inverse>{charAtCursor}</Text>
				{after}
			</Text>
		);
	};

	return (
		<Box flexDirection="column">
			{isSlash && matchingSuggestions.length > 0 && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="magenta"
					paddingX={1}
					marginBottom={0}
				>
					<Text bold color="magenta">
						Commands:
					</Text>
					{matchingSuggestions.map((s) => (
						<Box key={s.name}>
							<Text color="cyan">/{s.name}</Text>
							<Text dimColor> - {s.description}</Text>
						</Box>
					))}
					<Text dimColor italic>
						Tab to complete
					</Text>
				</Box>
			)}
			<Box borderStyle="single" paddingX={1}>
				{renderValue()}
			</Box>
		</Box>
	);
};
