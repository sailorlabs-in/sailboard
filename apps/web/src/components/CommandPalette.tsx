import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  Box,
  InputBase,
  Typography,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  SearchOutlined,
  SpaceDashboardOutlined,
  FolderOutlined,
  DrawOutlined,
  CropSquareOutlined,
  ChangeHistoryOutlined,
  RadioButtonUncheckedOutlined,
  EastOutlined,
  HorizontalRuleOutlined,
  TextFieldsOutlined,
  StickyNote2Outlined,
  ChatBubbleOutlined,
  AutoFixHighOutlined,
  PanToolOutlined,
  NearMeOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  GridOnOutlined,
  GridOffOutlined,
  FileDownloadOutlined,
  PersonAddOutlined,
  ManageAccountsOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FitScreenOutlined,
  UndoOutlined,
  RedoOutlined,
  ViewSidebarOutlined,
  BrushOutlined,
} from '@mui/icons-material';
import { ElementType, Project, WhiteboardDocument } from '@rea/shared-types';
import { ThemePreference } from '../theme/theme';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  currentProject: Project | null;
  currentFile: WhiteboardDocument | null;
  onSelectProject?: (projectId: string) => void;
  onOpenFile?: (project: Project, file: WhiteboardDocument) => void;
  onSelectFile?: (file: WhiteboardDocument) => void;
  onCreateFile?: (title: string) => void;
  onCreateProject?: (name: string, description?: string) => void;
  onSelectTool: (tool: ElementType | 'eraser' | 'pan' | 'comment') => void;
  activeTool: ElementType | 'eraser' | 'pan' | 'comment';
  theme: 'light' | 'dark';
  themePreference: ThemePreference;
  onThemeChange: (pref: ThemePreference) => void;
  viewMode: 'canvas' | 'split' | 'notes';
  onViewModeChange: (mode: 'canvas' | 'split' | 'notes') => void;
  styleMode: 'rough' | 'clean';
  onStyleModeChange: (mode: 'rough' | 'clean') => void;
  gridVisible: boolean;
  onGridVisibleToggle?: () => void;
  onToggleGrid?: () => void;
  gridSnap: boolean;
  onGridSnapToggle?: () => void;
  onToggleSnap?: () => void;
  gridType?: 'dots' | 'grid' | 'blank';
  onGridTypeChange?: (type: 'dots' | 'grid' | 'blank') => void;
  onExportClick?: () => void;
  onOpenExport?: () => void;
  onOpenShare?: () => void;
  onOpenAccountManage?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomToFit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Canvases' | 'Projects' | 'Tools' | 'Actions' | 'Preferences';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({
  open,
  onClose,
  projects,
  currentProject,
  currentFile,
  onSelectProject,
  onOpenFile,
  onSelectFile,
  onCreateFile,
  onCreateProject,
  onSelectTool,
  activeTool,
  theme,
  themePreference,
  onThemeChange,
  viewMode,
  onViewModeChange,
  styleMode,
  onStyleModeChange,
  gridVisible,
  onGridVisibleToggle,
  onToggleGrid,
  gridSnap,
  onGridSnapToggle,
  onToggleSnap,
  gridType,
  onGridTypeChange,
  onExportClick,
  onOpenExport,
  onOpenShare,
  onOpenAccountManage,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomToFit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Build Command Registry
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Files & Canvases
    projects.forEach((proj) => {
      (proj.files || []).forEach((file) => {
        items.push({
          id: `file-${file.id}`,
          title: file.title || 'Untitled Canvas',
          subtitle: `Project: ${proj.name}`,
          category: 'Canvases',
          icon: <SpaceDashboardOutlined sx={{ fontSize: 18, color: '#6366f1' }} />,
          action: () => {
            if (onOpenFile) {
              onOpenFile(proj, file);
            } else if (onSelectFile) {
              if (onSelectProject && currentProject?.id !== proj.id) {
                onSelectProject(proj.id);
              }
              onSelectFile(file);
            }
            onClose();
          },
        });
      });
    });

    // 2. Projects
    projects.forEach((proj) => {
      items.push({
        id: `proj-${proj.id}`,
        title: proj.name,
        subtitle: `${proj.files?.length || 0} canvases`,
        category: 'Projects',
        icon: <FolderOutlined sx={{ fontSize: 18, color: '#f59e0b' }} />,
        action: () => {
          onSelectProject?.(proj.id);
          onClose();
        },
      });
    });

    // 3. Whiteboard Tools
    items.push(
      {
        id: 'tool-selection',
        title: 'Select / Move Tool',
        category: 'Tools',
        shortcut: 'V',
        icon: <NearMeOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('selection');
          onClose();
        },
      },
      {
        id: 'tool-pan',
        title: 'Hand / Pan Canvas',
        category: 'Tools',
        shortcut: 'H',
        icon: <PanToolOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('pan');
          onClose();
        },
      },
      {
        id: 'tool-arrow',
        title: 'Arrow Connector (Shape Anchored)',
        category: 'Tools',
        shortcut: 'A',
        icon: <EastOutlined sx={{ fontSize: 18, color: '#06b6d4' }} />,
        action: () => {
          onSelectTool('arrow');
          onClose();
        },
      },
      {
        id: 'tool-line',
        title: 'Straight Line Connector',
        category: 'Tools',
        shortcut: 'L',
        icon: <HorizontalRuleOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('line');
          onClose();
        },
      },
      {
        id: 'tool-rectangle',
        title: 'Rectangle Shape',
        category: 'Tools',
        shortcut: 'R',
        icon: <CropSquareOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('rectangle');
          onClose();
        },
      },
      {
        id: 'tool-diamond',
        title: 'Diamond / Decision Shape',
        category: 'Tools',
        shortcut: 'D',
        icon: <ChangeHistoryOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('diamond');
          onClose();
        },
      },
      {
        id: 'tool-ellipse',
        title: 'Ellipse / Circle Shape',
        category: 'Tools',
        shortcut: 'O',
        icon: <RadioButtonUncheckedOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('ellipse');
          onClose();
        },
      },
      {
        id: 'tool-draw',
        title: 'Freehand Pen',
        category: 'Tools',
        shortcut: 'P',
        icon: <DrawOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('draw');
          onClose();
        },
      },
      {
        id: 'tool-text',
        title: 'Text Block',
        category: 'Tools',
        shortcut: 'T',
        icon: <TextFieldsOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('text');
          onClose();
        },
      },
      {
        id: 'tool-sticky',
        title: 'Sticky Note',
        category: 'Tools',
        shortcut: 'S',
        icon: <StickyNote2Outlined sx={{ fontSize: 18, color: '#f59e0b' }} />,
        action: () => {
          onSelectTool('sticky');
          onClose();
        },
      },
      {
        id: 'tool-comment',
        title: 'Comment Pin (Drop Note Pin)',
        category: 'Tools',
        shortcut: 'C',
        icon: <ChatBubbleOutlined sx={{ fontSize: 18, color: '#10b981' }} />,
        action: () => {
          onSelectTool('comment');
          onClose();
        },
      },
      {
        id: 'tool-eraser',
        title: 'Eraser',
        category: 'Tools',
        shortcut: 'E',
        icon: <AutoFixHighOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onSelectTool('eraser');
          onClose();
        },
      }
    );

    // 4. Actions & Layout
    items.push(
      {
        id: 'action-zoom-fit',
        title: 'Zoom to Fit Screen',
        category: 'Actions',
        shortcut: '⇧ 1',
        icon: <FitScreenOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onZoomToFit?.();
          onClose();
        },
      },
      {
        id: 'action-zoom-reset',
        title: 'Reset Zoom to 100%',
        category: 'Actions',
        shortcut: '⌘ 0',
        icon: <ZoomInOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onZoomReset?.();
          onClose();
        },
      },
      {
        id: 'action-view-split',
        title: 'Layout: Split View (Canvas & Notes)',
        category: 'Actions',
        icon: <ViewSidebarOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onViewModeChange('split');
          onClose();
        },
      },
      {
        id: 'action-view-canvas',
        title: 'Layout: Full Canvas Only',
        category: 'Actions',
        icon: <SpaceDashboardOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onViewModeChange('canvas');
          onClose();
        },
      },
      {
        id: 'action-view-notes',
        title: 'Layout: Architecture Notes Only',
        category: 'Actions',
        icon: <StickyNote2Outlined sx={{ fontSize: 18 }} />,
        action: () => {
          onViewModeChange('notes');
          onClose();
        },
      },
      {
        id: 'action-style-rough',
        title: 'Style: Hand-Drawn Sketch (RoughJS)',
        category: 'Actions',
        icon: <BrushOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onStyleModeChange('rough');
          onClose();
        },
      },
      {
        id: 'action-style-clean',
        title: 'Style: Clean Vector Geometry',
        category: 'Actions',
        icon: <CropSquareOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onStyleModeChange('clean');
          onClose();
        },
      },
      {
        id: 'action-export',
        title: 'Export Canvas (PNG, SVG, JSON)',
        category: 'Actions',
        shortcut: '⌘ E',
        icon: <FileDownloadOutlined sx={{ fontSize: 18, color: '#10b981' }} />,
        action: () => {
          (onOpenExport || onExportClick)?.();
          onClose();
        },
      },
      {
        id: 'action-share',
        title: 'Share Project & Invite Team Members',
        category: 'Actions',
        icon: <PersonAddOutlined sx={{ fontSize: 18, color: '#6366f1' }} />,
        action: () => {
          onOpenShare?.();
          onClose();
        },
      }
    );

    // 5. Preferences & Settings
    items.push(
      {
        id: 'pref-theme-dark',
        title: 'Theme: Dark Mode',
        category: 'Preferences',
        icon: <DarkModeOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onThemeChange('dark');
          onClose();
        },
      },
      {
        id: 'pref-theme-light',
        title: 'Theme: Light Mode',
        category: 'Preferences',
        icon: <LightModeOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onThemeChange('light');
          onClose();
        },
      },
      {
        id: 'pref-grid-toggle',
        title: gridVisible ? 'Hide Grid' : 'Show Grid',
        category: 'Preferences',
        shortcut: "⌘ '",
        icon: gridVisible ? <GridOffOutlined sx={{ fontSize: 18 }} /> : <GridOnOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          (onToggleGrid || onGridVisibleToggle)?.();
          onClose();
        },
      },
      {
        id: 'pref-snap-toggle',
        title: gridSnap ? 'Disable Grid Snap' : 'Enable Grid Snap',
        category: 'Preferences',
        icon: <GridOnOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          (onToggleSnap || onGridSnapToggle)?.();
          onClose();
        },
      },
      {
        id: 'pref-account-manage',
        title: 'Switch Profile / Manage Accounts',
        category: 'Preferences',
        icon: <ManageAccountsOutlined sx={{ fontSize: 18 }} />,
        action: () => {
          onOpenAccountManage?.();
          onClose();
        },
      }
    );

    return items;
  }, [
    projects,
    currentProject,
    currentFile,
    activeTool,
    themePreference,
    viewMode,
    styleMode,
    gridVisible,
    gridSnap,
    gridType,
    canUndo,
    canRedo,
    onOpenFile,
    onSelectProject,
    onSelectTool,
    onThemeChange,
    onViewModeChange,
    onStyleModeChange,
    onGridVisibleToggle,
    onGridSnapToggle,
    onExportClick,
    onOpenShare,
    onOpenAccountManage,
    onZoomToFit,
    onZoomReset,
    onClose,
  ]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return allCommands;
    const q = search.toLowerCase().trim();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle?.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.shortcut?.toLowerCase().includes(q)
    );
  }, [search, allCommands]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          },
        },
        paper: {
          sx: {
            borderRadius: '20px',
            bgcolor: 'var(--neu-surface)',
            border: 'var(--neu-border)',
            boxShadow: 'var(--neu-shadow-floating)',
            overflow: 'hidden',
            p: 0,
            mt: -12,
          },
        },
      }}
    >
      {/* Search Input Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.8,
          borderBottom: 'var(--neu-border-inset)',
          bgcolor: 'var(--neu-bg)',
        }}
      >
        <SearchOutlined sx={{ color: 'var(--neu-text-secondary)', fontSize: 22 }} />
        <InputBase
          inputRef={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search canvases, tools, or actions... (↑↓ to navigate, ↵ to run)"
          fullWidth
          sx={{
            fontSize: '1rem',
            fontWeight: 500,
            color: 'var(--neu-text-primary)',
          }}
        />
        <Chip
          label="ESC"
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: 'var(--neu-surface)',
            border: 'var(--neu-border)',
            color: 'var(--neu-text-secondary)',
          }}
        />
      </Box>

      {/* Results List */}
      <List
        ref={listRef}
        sx={{
          maxHeight: 380,
          overflowY: 'auto',
          py: 1,
          px: 1,
        }}
      >
        {filteredCommands.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'var(--neu-text-muted)' }}>
              No commands or canvases found matching "{search}"
            </Typography>
          </Box>
        ) : (
          filteredCommands.map((cmd, index) => {
            const isSelected = index === selectedIndex;

            return (
              <ListItemButton
                key={cmd.id}
                selected={isSelected}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(index)}
                sx={{
                  borderRadius: '12px',
                  my: 0.3,
                  py: 1,
                  px: 1.5,
                  bgcolor: isSelected ? 'var(--neu-card-hover)' : 'transparent',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  boxShadow: isSelected ? 'var(--neu-shadow-raised-sm)' : 'none',
                  transition: 'background-color 0.1s, box-shadow 0.1s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'var(--neu-text-primary)' }}>
                  {cmd.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 500, color: 'var(--neu-text-primary)' }}>
                        {cmd.title}
                      </Typography>
                      <Chip
                        label={cmd.category}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#6366f1',
                          border: 'none',
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    cmd.subtitle ? (
                      <Typography variant="caption" sx={{ color: 'var(--neu-text-muted)', fontSize: '0.72rem' }}>
                        {cmd.subtitle}
                      </Typography>
                    ) : null
                  }
                />
                {cmd.shortcut && (
                  <Chip
                    label={cmd.shortcut}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: 'var(--neu-surface)',
                      border: 'var(--neu-border)',
                      color: 'var(--neu-text-secondary)',
                    }}
                  />
                )}
              </ListItemButton>
            );
          })
        )}
      </List>

      {/* Footer Helper */}
      <Box
        sx={{
          px: 2.5,
          py: 1.2,
          bgcolor: 'var(--neu-bg)',
          borderTop: 'var(--neu-border-inset)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" sx={{ color: 'var(--neu-text-muted)', fontSize: '0.72rem' }}>
          Sailboard Command Palette • Instant Search & Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.72rem' }}>
            <b>↑↓</b> to navigate
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.72rem' }}>
            <b>↵</b> to select
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--neu-text-secondary)', fontSize: '0.72rem' }}>
            <b>esc</b> to exit
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
