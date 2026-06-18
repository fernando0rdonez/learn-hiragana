import React from "react";
import { FluentEmoji } from "@lobehub/fluent-emoji";

class EmojiErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

interface Props {
  emoji: string;
  label: string;
  size?: number;
}

export default function EmojiDisplay({ emoji, label, size = 128 }: Props) {
  const fallback = (
    <span role="img" aria-label={label} style={{ fontSize: size * 0.7, lineHeight: 1 }}>
      {emoji}
    </span>
  );
  return (
    <EmojiErrorBoundary fallback={fallback}>
      <FluentEmoji emoji={emoji} size={size} />
    </EmojiErrorBoundary>
  );
}
