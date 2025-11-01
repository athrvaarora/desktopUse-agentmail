import { Folder, FolderOpen, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export interface FolderTree {
  children: any;
  is_dir: boolean;
  name: string;
  path: string;
}

interface FolderTreeProps {
  expandedFolders: Set<string>;
  isLoading: boolean;
  isResizing: boolean;
  isVisible: boolean;
  onContextMenu(event: any, path: string | null, isPinned?: boolean): void;
  onFolderSelect(folder: string): void;
  onToggleFolder(folder: string): void;
  selectedPath: string | null;
  setIsVisible(visible: boolean): void;
  style: any;
  tree: FolderTree | null;
  pinnedFolderTrees: FolderTree[];
  pinnedFolders: string[];
  activeSection: string | null;
  onActiveSectionChange(section: string | null): void;
}

interface TreeNodeProps {
  expandedFolders: Set<string>;
  isExpanded: boolean;
  node: FolderTree;
  onContextMenu(event: any, path: string, isPinned?: boolean): void;
  onFolderSelect(folder: string): void;
  onToggle(path: string): void;
  selectedPath: string | null;
  pinnedFolders: string[];
  isRootPinnedNode?: boolean;
}

interface VisibleProps {
  index: number;
  total: number;
}

function SectionHeader({ title, isOpen, onToggle }: { title: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex items-center w-full text-left px-1 py-1.5 cursor-pointer group"
      onClick={onToggle}
      title={isOpen ? `Collapse ${title}` : `Expand ${title}`}
    >
      <div className="p-0.5 rounded-md transition-colors">
        {isOpen ? (
          <ChevronDown size={14} className="text-text-secondary" />
        ) : (
          <ChevronRight size={14} className="text-text-secondary" />
        )}
      </div>
      <span className="ml-1 text-xs font-bold uppercase text-text-secondary tracking-wider select-none">
        {title}
      </span>
    </div>
  );
}

function TreeNode({
  expandedFolders,
  isExpanded,
  node,
  onContextMenu,
  onFolderSelect,
  onToggle,
  selectedPath,
  pinnedFolders,
  isRootPinnedNode = false,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.path === selectedPath;
  const isPinned = pinnedFolders.includes(node.path);

  const handleFolderIconClick = (e: any) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.path);
    }
  };

  const handleNameClick = () => {
    onFolderSelect(node.path);
  };

  const handleNameDoubleClick = () => {
    if (hasChildren) {
      onToggle(node.path);
    }
  };

  const containerVariants: any = {
    closed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
    open: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: 'easeInOut' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: ({ index, total }: VisibleProps) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        delay: total < 8 ? index * 0.05 : 0,
      },
    }),
    exit: { opacity: 0, x: -15, transition: { duration: 0.2 } },
  };

  return (
    <div className="text-sm">
      <div
        className={clsx('flex items-center gap-2 p-1.5 rounded-md transition-colors', {
          'bg-card-active': isSelected,
          'hover:bg-surface': !isSelected,
        })}
        onClick={handleNameClick}
        onContextMenu={(e: any) => onContextMenu(e, node.path, isPinned)}
      >
        <div
          className={clsx('cursor-pointer p-0.5 rounded hover:bg-surface', {
            'cursor-default': !hasChildren,
          })}
          onClick={handleFolderIconClick}
        >
          {isExpanded ? (
            <FolderOpen size={16} className="text-hover-color flex-shrink-0" />
          ) : (
            <Folder size={16} className="text-text-secondary flex-shrink-0" />
          )}
        </div>
        <span
          onDoubleClick={handleNameDoubleClick}
          className="truncate select-none cursor-pointer flex-1"
        >
          {node.name}
        </span>
        {hasChildren && (
          <div
            className="p-0.5 rounded hover:bg-surface cursor-pointer"
            onClick={handleFolderIconClick}
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-text-secondary flex-shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-text-secondary flex-shrink-0" />
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            animate="open"
            className="pl-4 border-l border-border-color/20 ml-2 overflow-hidden"
            exit="closed"
            initial="closed"
            key="children-container"
            variants={containerVariants}
          >
            <div className="py-1">
              <AnimatePresence>
                {node?.children?.map((childNode: any, index: number) => (
                  <motion.div
                    animate="visible"
                    custom={{ index, total: node.children.length }}
                    exit="exit"
                    initial="hidden"
                    key={childNode.path}
                    layout="position"
                    variants={itemVariants}
                  >
                    <TreeNode
                      expandedFolders={expandedFolders}
                      isExpanded={expandedFolders.has(childNode.path)}
                      node={childNode}
                      onContextMenu={onContextMenu}
                      onFolderSelect={onFolderSelect}
                      onToggle={onToggle}
                      selectedPath={selectedPath}
                      pinnedFolders={pinnedFolders}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FolderTree({
  expandedFolders,
  isLoading,
  isResizing,
  isVisible,
  onContextMenu,
  onFolderSelect,
  onToggleFolder,
  selectedPath,
  setIsVisible,
  style,
  tree,
  pinnedFolderTrees,
  pinnedFolders,
  activeSection,
  onActiveSectionChange,
}: FolderTreeProps) {
  const handleEmptyAreaContextMenu = (e: any) => {
    if (e.target === e.currentTarget) {
      onContextMenu(e, null, false);
    }
  };

  const isPinnedOpen = activeSection === 'pinned';
  const isCurrentOpen = activeSection === 'current';

  return (
    <div
      className={clsx(
        'relative bg-bg-secondary rounded-lg flex-shrink-0',
        !isResizing && 'transition-[width] duration-300 ease-in-out',
      )}
      style={style}
    >
      <button
        className="absolute top-1/2 -translate-y-1/2 right-1 w-6 h-10 hover:bg-card-active rounded-md flex items-center justify-center z-10"
        onClick={() => setIsVisible(!isVisible)}
        title={isVisible ? 'Collapse Panel' : 'Expand Panel'}
      >
        {isVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {isVisible && (
        <div className="p-2 flex flex-col overflow-y-auto h-full" onContextMenu={handleEmptyAreaContextMenu}>
          {pinnedFolderTrees && pinnedFolderTrees.length > 0 && (
            <div className="mb-2">
              <SectionHeader
                title="Pinned"
                isOpen={isPinnedOpen}
                onToggle={() => onActiveSectionChange(isPinnedOpen ? null : 'pinned')}
              />
              <AnimatePresence initial={false}>
                {isPinnedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1">
                      {pinnedFolderTrees.map((pinnedTree) => (
                        <TreeNode
                          key={pinnedTree.path}
                          expandedFolders={expandedFolders}
                          isExpanded={expandedFolders.has(pinnedTree.path)}
                          node={pinnedTree}
                          onContextMenu={onContextMenu}
                          onFolderSelect={onFolderSelect}
                          onToggle={onToggleFolder}
                          selectedPath={selectedPath}
                          pinnedFolders={pinnedFolders}
                          isRootPinnedNode
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div>
            <SectionHeader
              title="Base Folder"
              isOpen={isCurrentOpen}
              onToggle={() => onActiveSectionChange(isCurrentOpen ? null : 'current')}
            />
            <AnimatePresence initial={false}>
              {isCurrentOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-1">
                    {tree ? (
                      <TreeNode
                        expandedFolders={expandedFolders}
                        isExpanded={expandedFolders.has(tree.path)}
                        node={tree}
                        onContextMenu={onContextMenu}
                        onFolderSelect={onFolderSelect}
                        onToggle={onToggleFolder}
                        selectedPath={selectedPath}
                        pinnedFolders={pinnedFolders}
                      />
                    ) : isLoading ? (
                      <p className="text-text-secondary text-sm animate-pulse p-2">Loading folder structure...</p>
                    ) : (
                      <p className="text-text-secondary text-sm p-2">Open a folder to see its structure.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}