import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Divider,
  ButtonGroup,
} from '@mui/material';
import {
  FormatBoldOutlined,
  FormatItalicOutlined,
  TitleOutlined,
  CodeOutlined,
  FormatListBulletedOutlined,
  CheckCircleOutlined,
  AutoAwesomeOutlined,
  VisibilityOutlined,
  EditOutlined,
} from '@mui/icons-material';
import { CanvasElement } from '@rea/shared-types';

interface NotesEditorProps {
  notes: string;
  onChange: (notes: string) => void;
  onGenerateDiagramFromNotes: (notes: string) => void;
  theme: 'light' | 'dark';
  isViewer?: boolean;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  notes,
  onChange,
  onGenerateDiagramFromNotes,
  theme,
  isViewer,
}) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'edit' | 'preview'>(isViewer ? 'preview' : 'edit');

  const insertText = (before: string, after = '') => {
    const textarea = document.getElementById('eraser-notes-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = notes.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;
    const newNotes = notes.substring(0, start) + replacement + notes.substring(end);

    onChange(newNotes);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + replacement.length - after.length);
    }, 0);
  };

  // Simple clean markdown parser for preview
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <Typography key={idx} variant="h5" sx={{ fontWeight: 700, mt: 1, color: '#6366f1' }}>
                {line.slice(2)}
              </Typography>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <Typography key={idx} variant="h6" sx={{ fontWeight: 600, mt: 0.8 }}>
                {line.slice(3)}
              </Typography>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <Typography key={idx} variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
                {line.slice(4)}
              </Typography>
            );
          }
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const checked = line.startsWith('- [x] ');
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlined sx={{ fontSize: 16, color: checked ? '#10b981' : '#94a3b8' }} />
                <Typography variant="body2" sx={{ textDecoration: checked ? 'line-through' : 'none' }}>
                  {line.slice(6)}
                </Typography>
              </Box>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#6366f1' }} />
                <Typography variant="body2">{line.slice(2)}</Typography>
              </Box>
            );
          }
          if (line.startsWith('```')) {
            return (
              <Box
                key={idx}
                sx={{
                  bgcolor: isDark ? '#0f172a' : '#f1f5f9',
                  p: 1,
                  borderRadius: 1,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.8rem',
                  color: '#ec4899',
                }}
              >
                {line}
              </Box>
            );
          }
          if (line.trim() === '') {
            return <Box key={idx} sx={{ height: 8 }} />;
          }
          return (
            <Typography key={idx} variant="body2" sx={{ lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#334155' }}>
              {line}
            </Typography>
          );
        })}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--neu-bg)',
        borderRight: 'var(--neu-border)',
      }}
    >
      {/* Doc Header & Action Bar */}
      <Box
        sx={{
          p: 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 'var(--neu-border)',
          bgcolor: 'var(--neu-surface)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2, color: 'var(--neu-text-primary)' }}>
            Engineering Spec
          </Typography>
          <Box className="neu-segmented">
            <button
              type="button"
              className={`neu-segmented-item ${tab === 'edit' ? 'active' : ''}`}
              onClick={() => setTab('edit')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: '0.68rem' }}
            >
              <EditOutlined sx={{ fontSize: 13 }} />
              Edit
            </button>
            <button
              type="button"
              className={`neu-segmented-item ${tab === 'preview' ? 'active' : ''}`}
              onClick={() => setTab('preview')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: '0.68rem' }}
            >
              <VisibilityOutlined sx={{ fontSize: 13 }} />
              Preview
            </button>
          </Box>
        </Box>

        {/* Generate Diagram from Markdown */}
        <Tooltip title={isViewer ? 'Viewers cannot generate diagrams' : 'AI/Syntax Assist: Generate architecture whiteboard shapes directly from document headings and lists!'}>
          <span>
            <Button
              size="small"
              variant="contained"
              disabled={isViewer}
              startIcon={<AutoAwesomeOutlined />}
              onClick={() => onGenerateDiagramFromNotes(notes)}
              className="neu-btn-primary"
              sx={{
                fontSize: '0.72rem',
                py: 0.4,
                px: { xs: 1, sm: 1.4 },
                borderRadius: '8px',
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Doc → Diagram</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Diagram</Box>
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Markdown Quick Toolbar */}
      {tab === 'edit' && !isViewer && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1.5,
            py: 0.8,
            borderBottom: 'var(--neu-border-subtle)',
            bgcolor: 'var(--neu-surface)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Tooltip title="Heading 1 (#)">
            <IconButton size="small" onClick={() => insertText('# ')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <TitleOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bold (**text**)">
            <IconButton size="small" onClick={() => insertText('**', '**')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <FormatBoldOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (*text*)">
            <IconButton size="small" onClick={() => insertText('*', '*')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <FormatItalicOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code Block (```)">
            <IconButton size="small" onClick={() => insertText('```\n', '\n```')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <CodeOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bullet List (- )">
            <IconButton size="small" onClick={() => insertText('- ')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <FormatListBulletedOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Task Checklist (- [ ] )">
            <IconButton size="small" onClick={() => insertText('- [ ] ')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <CheckCircleOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Editor Body or Preview Body */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {tab === 'edit' ? (
          <textarea
            id="eraser-notes-textarea"
            value={notes}
            readOnly={isViewer}
            onChange={(e) => !isViewer && onChange(e.target.value)}
            placeholder={
              isViewer
                ? 'Read-only notes preview...'
                : 'Write design notes, system specs, flow descriptions in Markdown...'
            }
            className="neu-inset"
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              lineHeight: 1.7,
              borderRadius: '12px',
              color: 'var(--neu-text-primary)',
            }}
          />
        ) : (
          <Box className="neu-inset" sx={{ p: 1.5, borderRadius: '12px', minHeight: '100%' }}>
            {renderMarkdownPreview(notes)}
          </Box>
        )}
      </Box>
    </Box>
  );
};
