import React from 'react';
// @ts-ignore - react-window types may not be perfect
import { FixedSizeList } from 'react-window';
import './VirtualList.css';

interface VirtualListProps {
    items: any[];
    itemHeight: number;
    height: number;
    renderItem: (item: any, index: number) => React.ReactNode;
    width?: string | number;
}

/**
 * VirtualList - Efficiently render large lists using react-window
 * 
 * @param items - Array of items to render
 * @param itemHeight - Height of each row in pixels
 * @param height - Total height of the list container
 * @param renderItem - Function to render each item
 * @param width - Width of the list (default: 100%)
 * 
 * @example
 * <VirtualList
 *   items={projects}
 *   itemHeight={120}
 *   height={600}
 *   renderItem={(project) => <ProjectCard project={project} />}
 * />
 */
export const VirtualList: React.FC<VirtualListProps> = ({
    items,
    itemHeight,
    height,
    renderItem,
    width = '100%',
}) => {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>
            {renderItem(items[index], index)}
        </div>
    );

    return (
        <FixedSizeList
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            width={width}
        >
            {Row}
        </FixedSizeList>
    );
};

export default VirtualList;
