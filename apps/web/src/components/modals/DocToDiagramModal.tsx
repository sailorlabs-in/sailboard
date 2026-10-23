import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  Chip,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome,
  AccountTreeOutlined,
  AltRouteOutlined,
  ViewKanbanOutlined,
  TimelineOutlined,
  PaletteOutlined,
  FormatPaintOutlined,
  Close,
  ContentPasteOutlined,
  LightbulbOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { CanvasElement } from '@rea/shared-types';
import {
  DiagramLayoutType,
  DiagramPalette,
  DiagramPlacement,
  parseDocToGraph,
  generateDiagramElements,
} from '../../utils/docToDiagramParser';
import { animateModalIn } from '../../utils/animations';

export interface DocToDiagramModalProps {
  open: boolean;
  onClose: () => void;
  initialText: string;
  existingElements: CanvasElement[];
  onInsertElements: (elements: CanvasElement[], replace?: boolean) => void;
  styleMode: 'rough' | 'clean';
  theme: 'light' | 'dark';
}

// Preset templates inspired by Eraser.io Diagram-as-Code
const PRESETS: Record<string, { label: string; layout: DiagramLayoutType; text: string }> = {
  microservices: {
    label: 'Microservices & Cache Flow',
    layout: 'architecture',
    text: `# E-Commerce Microservices
Client App > API Gateway: HTTPS
API Gateway > Auth Service: Verify JWT
API Gateway > Product Service: Get Catalog
Product Service > Redis Cache: Cache Hit
Product Service > PostgreSQL DB: Query Fallback
API Gateway > Payment Service: Process Order
Payment Service > Message Queue: Publish Event
Message Queue > Notification Worker: Send Email`,
  },
  oauth: {
    label: 'OAuth 2.0 Auth Pipeline',
    layout: 'sequence',
    text: `# OAuth 2.0 Authorization Flow
1. User clicks Login with Google
2. Web Browser redirects to Auth Server
3. Auth Server prompts User Consent
4. Auth Server returns Authorization Code
5. Backend exchanges Code for Access Token
6. Backend verifies Token & loads User Profile`,
  },
  cloudInfra: {
    label: 'Cloud Infrastructure & VPC',
    layout: 'grid',
    text: `# Presentation Layer
- React Web App
- iOS Mobile Client
- Cloudflare CDN

# Backend Application Layer
- NGINX Ingress Router
- Node.js API Gateway
- Go Microservices Cluster

# Data & Persistence Layer
- PostgreSQL Primary
- Redis Cluster Cache
- AWS S3 Object Storage`,
  },
  mindmap: {
    label: 'System Architecture Mindmap',
    layout: 'mindmap',
    text: `# Sailboard Collaborative Workspace
## Realtime Canvas Engine
- WebGL & 2D Context
- Figma Precision Cursors
- Dynamic Shape Anchors
## Document System
- Markdown Notes Editor
- Diagram-as-Code Parser
- Local & Cloud Sync
## Collaboration Engine
- WebSockets Broadcast
- Multi-Cursor Presence
- Conflict Resolution`,
  },
};

export function DocToDiagramModal({
  open,
  onClose,
  initialText,
  existingElements,
  onInsertElements,
  styleMode,
  theme,
}: DocToDiagramModalProps) {
  const isDark = theme === 'dark';
  const [docText, setDocText] = useState(initialText || PRESETS.microservices.text);
  const [layout, setLayout] = useState<DiagramLayoutType>('architecture');
  const [palette, setPalette] = useState<DiagramPalette>('indigo');
  const [placement, setPlacement] = useState<DiagramPlacement>('below');

  // Live Graph Parse Stats
  const parsedGraph = useMemo(() => {
    return parseDocToGraph(docText);
  }, [docText]);

  const handleApplyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      setDocText(preset.text);
      setLayout(preset.layout);
      toast.success(`Loaded "${preset.label}" template`);
    }
  };

  const handleGenerate = () => {
    try {
      const generated = generateDiagramElements(docText, {
        layout,
        palette,
        placement,
        styleMode,
        existingElements,
      });

      if (generated.length === 0) {
        toast.error('Could not extract nodes from text. Please check format.');
        return;
      }

      onInsertElements(generated, placement === 'replace');
      toast.success(`Generated ${generated.filter((e) => e.type !== 'arrow').length} diagram shapes!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate diagram');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{
        onEnter: (node) => {
          animateModalIn(node);
        },
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '20px',
            bgcolor: isDark ? '#1a1d2d' : '#f8fafc',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          pb: 1.5,
          pt: 2.5,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(99,102,241,0.35)',
            }}
          >
            <AutoAwesome sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2 }}>
              Doc → Diagram Studio
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
              Eraser-style Diagram-as-Code & Markdown Architecture Generator
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <Close sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Diagram Paradigm Selector Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={layout}
            onChange={(_, val) => setLayout(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                gap: 0.8,
                minHeight: 46,
              },
            }}
          >
            <Tab icon={<AccountTreeOutlined sx={{ fontSize: 18 }} />} label="Architecture & Flow" value="architecture" />
            <Tab icon={<AltRouteOutlined sx={{ fontSize: 18 }} />} label="Mindmap & Tree" value="mindmap" />
            <Tab icon={<TimelineOutlined sx={{ fontSize: 18 }} />} label="Sequence Pipeline" value="sequence" />
            <Tab icon={<ViewKanbanOutlined sx={{ fontSize: 18 }} />} label="Categorized Layers" value="grid" />
          </Tabs>
        </Box>

        {/* Quick Inspiration Templates */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LightbulbOutlined sx={{ fontSize: 16 }} /> Quick Templates:
          </Typography>
          {Object.entries(PRESETS).map(([k, p]) => (
            <Chip
              key={k}
              label={p.label}
              size="small"
              onClick={() => handleApplyPreset(k)}
              clickable
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '8px',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                '&:hover': {
                  borderColor: '#6366f1',
                  bgcolor: 'rgba(99,102,241,0.08)',
                },
              }}
            />
          ))}
        </Box>

        {/* Document Markdown / DSL Editor */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.86rem' }}>
              Source Document Text / Diagram-as-Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`⚡ ${parsedGraph.nodes.length} Nodes detected`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.72rem', height: 22 }}
              />
              <Chip
                label={`🔗 ${parsedGraph.connections.length} Connectors`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: '0.72rem', height: 22 }}
              />
            </Box>
          </Box>

          <TextField
            multiline
            rows={7}
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            placeholder="Type document headings (# Heading), bullets (- Item), or Eraser syntax (Client > API Gateway > Database: Query)..."
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '0.85rem',
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(0,0,0,0.25)' : '#ffffff',
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            💡 Supports standard Markdown (<code>#</code>, <code>##</code>, <code>-</code>) and Eraser connector syntax (e.g. <code>A &gt; B: label</code>).
          </Typography>
        </Box>

        {/* Live Parsed Graph Preview Strip */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(241,245,249,0.8)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', whiteSpace: 'nowrap', mr: 1 }}>
            Preview Chain:
          </Typography>
          {parsedGraph.nodes.slice(0, 7).map((node, i) => (
            <React.Fragment key={node.id}>
              <Chip
                label={node.text}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  bgcolor: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff',
                  color: isDark ? '#c7d2fe' : '#3730a3',
                  borderRadius: '6px',
                }}
              />
              {i < Math.min(6, parsedGraph.nodes.length - 1) && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>→</Typography>
              )}
            </React.Fragment>
          ))}
          {parsedGraph.nodes.length > 7 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
              +{parsedGraph.nodes.length - 7} more
            </Typography>
          )}
        </Box>

        {/* Customization Options: Palette & Placement */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          {/* Color Palette Selector */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.84rem', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <PaletteOutlined sx={{ fontSize: 16 }} /> Color Palette
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['indigo', 'emerald', 'amber', 'cyan', 'slate'] as DiagramPalette[]).map((p) => {
                const colorHex = p === 'indigo' ? '#6366f1' : p === 'emerald' ? '#10b981' : p === 'amber' ? '#f59e0b' : p === 'cyan' ? '#06b6d4' : '#64748b';
                return (
                  <Tooltip key={p} title={p.toUpperCase()}>
                    <Box
                      onClick={() => setPalette(p)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        bgcolor: colorHex,
                        cursor: 'pointer',
                        border: palette === p ? '3px solid #ffffff' : '1px solid transparent',
                        boxShadow: palette === p ? `0 0 10px ${colorHex}` : 'none',
                        transition: 'all 0.18s ease',
                        '&:hover': { transform: 'scale(1.1)' },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Canvas Placement Selector */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.84rem', mb: 0.5 }}>
              Canvas Placement
            </Typography>
            <RadioGroup row value={placement} onChange={(e) => setPlacement(e.target.value as DiagramPlacement)}>
              <FormControlLabel value="below" control={<Radio size="small" />} label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Insert Below</Typography>} />
              <FormControlLabel value="right" control={<Radio size="small" />} label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Insert Right</Typography>} />
              <FormControlLabel value="replace" control={<Radio size="small" />} label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Replace Canvas</Typography>} />
            </RadioGroup>
          </Box>
        </Box>
      </DialogContent>

      {/* Modal Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleGenerate}
          startIcon={<AutoAwesome />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '10px',
            px: 3,
            py: 1,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
            },
          }}
        >
          Generate & Add to Canvas
        </Button>
      </DialogActions>
    </Dialog>
  );
}
