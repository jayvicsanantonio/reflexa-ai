/**
 * Content Renderer Component
 * Renders content as bullets or paragraph
 */

import React from 'react';

interface ContentRendererProps {
  content: string[];
  format: 'bullets' | 'paragraph';
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  format,
}) => {
  if (format === 'bullets') {
    return (
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          listStyle: 'disc',
        }}
      >
        {content.map((item, i) => (
          <li
            key={i}
            style={{
              marginBottom: 8,
              lineHeight: 1.6,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return <p style={{ margin: 0, lineHeight: 1.8 }}>{content.join(' ')}</p>;
};
