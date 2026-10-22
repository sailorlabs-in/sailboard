import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  SendOutlined,
  CheckCircleOutlined,
  CheckCircle,
  DeleteOutlined,
  CloseOutlined,
  ChatBubbleOutlined,
} from '@mui/icons-material';
import { CanvasComment, User, Point } from '@rea/shared-types';

export interface CanvasCommentsProps {
  comments: CanvasComment[];
  zoom: number;
  pan: Point;
  currentUser?: User | null;
  visible?: boolean;
  activeCommentId: string | null;
  onSelectComment: (id: string | null) => void;
  onCreateComment?: (x: number, y: number, content: string) => Promise<void>;
  onSubmitPendingPin?: (content: string) => Promise<void>;
  onReplyComment: (commentId: string, content: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  pendingPinPos: Point | null;
  onCancelPendingPin: () => void;
  theme: 'light' | 'dark';
  isViewer?: boolean;
  canComment?: boolean;
  isOwner?: boolean;
  isEditor?: boolean;
}

function CanvasCommentsComponent({
  comments,
  zoom,
  pan,
  currentUser,
  visible = true,
  activeCommentId,
  onSelectComment,
  onCreateComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
  pendingPinPos,
  onCancelPendingPin,
  onSubmitPendingPin,
  theme,
  isViewer,
  canComment = true,
  isOwner = false,
  isEditor = false,
}: CanvasCommentsProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newCommentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pendingPinPos && newCommentInputRef.current) {
      setTimeout(() => newCommentInputRef.current?.focus(), 50);
    }
  }, [pendingPinPos]);

  if (!visible) return null;

  const handlePostNew = async () => {
    if (!newCommentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSubmitPendingPin) {
        await onSubmitPendingPin(newCommentText.trim());
      } else if (onCreateComment && pendingPinPos) {
        await onCreateComment(pendingPinPos.x, pendingPinPos.y, newCommentText.trim());
      }
      setNewCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReply = async (commentId: string) => {
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReplyComment(commentId, replyText.trim());
      setReplyText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      {/* Existing Comment Pins */}
      {comments.map((comment) => {
        const screenX = comment.x * zoom + pan.x;
        const screenY = comment.y * zoom + pan.y;
        const isOpen = activeCommentId === comment.id;
        const replyCount = comment.replies?.length || 0;
        const authorInitial = (comment.author?.name || 'U').charAt(0).toUpperCase();

        return (
          <Box
            key={comment.id}
            sx={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'auto',
            }}
          >
            {/* Tactile Comment Pin Icon */}
            <Tooltip
              title={`${comment.author?.name || 'Peer'}: "${comment.content.slice(0, 36)}..."`}
              placement="top"
              arrow
            >
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComment(isOpen ? null : comment.id);
                }}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50% 50% 50% 4px',
                  bgcolor: comment.author?.color || '#6366f1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isOpen
                    ? '0 0 0 3px rgba(99, 102, 241, 0.4), 0 8px 18px rgba(0,0,0,0.35)'
                    : '0 4px 12px rgba(0,0,0,0.25)',
                  transform: isOpen ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s',
                  border: '2px solid #ffffff',
                  opacity: comment.resolved ? 0.6 : 1,
                  filter: comment.resolved ? 'grayscale(0.5)' : 'none',
                }}
              >
                {comment.resolved ? (
                  <CheckCircle sx={{ fontSize: 18 }} />
                ) : replyCount > 0 ? (
                  <Badge
                    badgeContent={replyCount}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.62rem',
                        height: 16,
                        minWidth: 16,
                        top: -4,
                        right: -4,
                        bgcolor: '#10b981',
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800 }}>
                      {authorInitial}
                    </Typography>
                  </Badge>
                ) : (
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800 }}>
                    {authorInitial}
                  </Typography>
                )}
              </Box>
            </Tooltip>

            {/* Thread Popover Card */}
            {isOpen && (
              <Paper
                className="neu-card"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  top: 40,
                  left: -12,
                  width: 320,
                  maxHeight: 420,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'var(--neu-surface)',
                  borderRadius: '16px',
                  boxShadow: 'var(--neu-shadow-floating)',
                  border: 'var(--neu-border)',
                  overflow: 'hidden',
                  zIndex: 30,
                  p: 2,
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        bgcolor: comment.author?.color || '#6366f1',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {authorInitial}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                        {comment.author?.name || 'Collaborator'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--neu-text-muted)', fontSize: '0.7rem' }}>
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {canComment && (
                      <Tooltip title={comment.resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}>
                        <IconButton
                          size="small"
                          onClick={() => onResolveComment(comment.id)}
                          sx={{
                            color: comment.resolved ? '#10b981' : 'var(--neu-text-secondary)',
                            p: 0.5,
                          }}
                        >
                          {comment.resolved ? <CheckCircle sx={{ fontSize: 18 }} /> : <CheckCircleOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    )}

                    {(() => {
                      const isCommentOwner = Boolean(
                        (currentUser?.id && comment.author?.id && currentUser.id === comment.author.id) ||
                        (!comment.author?.id && !currentUser?.id)
                      );
                      const canDelete = isOwner || isEditor || isCommentOwner;

                      return canDelete ? (
                        <Tooltip title="Delete Comment Thread">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteComment(comment.id)}
                            sx={{ color: 'var(--neu-text-secondary)', p: 0.5 }}
                          >
                            <DeleteOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      ) : null;
                    })()}

                    <IconButton
                      size="small"
                      onClick={() => onSelectComment(null)}
                      sx={{ color: 'var(--neu-text-secondary)', p: 0.5 }}
                    >
                      <CloseOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Main Comment Text */}
                <Box
                  className="neu-inset"
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: 'var(--neu-bg)',
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      color: 'var(--neu-text-primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      textDecoration: comment.resolved ? 'line-through' : 'none',
                      opacity: comment.resolved ? 0.7 : 1,
                    }}
                  >
                    {comment.content}
                  </Typography>
                </Box>

                {/* Replies Thread */}
                {comment.replies && comment.replies.length > 0 && (
                  <Box
                    sx={{
                      maxHeight: 160,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      mb: 1.5,
                      pr: 0.5,
                    }}
                  >
                    {comment.replies.map((reply) => (
                      <Box
                        key={reply.id}
                        sx={{
                          display: 'flex',
                          gap: 1,
                          alignItems: 'flex-start',
                          p: 1,
                          borderRadius: '8px',
                          bgcolor: 'rgba(99, 102, 241, 0.05)',
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 20,
                            height: 20,
                            bgcolor: reply.author?.color || '#8b5cf6',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            mt: 0.2,
                          }}
                        >
                          {(reply.author?.name || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                              {reply.author?.name || 'Peer'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--neu-text-muted)', fontSize: '0.65rem' }}>
                              {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'var(--neu-text-primary)', wordBreak: 'break-word' }}>
                            {reply.content}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Reply Input */}
                {!canComment ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--neu-text-muted)',
                      fontStyle: 'italic',
                      display: 'block',
                      textAlign: 'center',
                      py: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    Viewers cannot reply to comments.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Reply to thread..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostReply(comment.id);
                        }
                      }}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          bgcolor: 'var(--neu-bg)',
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      disabled={!replyText.trim() || isSubmitting}
                      onClick={() => handlePostReply(comment.id)}
                      className="neu-btn-primary"
                      sx={{
                        bgcolor: 'var(--neu-primary)',
                        color: '#ffffff',
                        p: 1,
                        borderRadius: '8px',
                        '&:disabled': { opacity: 0.4 },
                      }}
                    >
                      <SendOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        );
      })}

      {/* Pending Pin Placement */}
      {pendingPinPos && (
        <Box
          sx={{
            position: 'absolute',
            left: pendingPinPos.x * zoom + pan.x,
            top: pendingPinPos.y * zoom + pan.y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'auto',
          }}
        >
          {/* Pulsing Pin */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50% 50% 50% 4px',
              bgcolor: currentUser?.color || '#6366f1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.4), 0 8px 20px rgba(0,0,0,0.4)',
              border: '2px solid #ffffff',
              animation: 'pulse 1.8s infinite',
            }}
          >
            <ChatBubbleOutlined sx={{ fontSize: 18 }} />
          </Box>

          {/* New Comment Popover Card */}
          <Paper
            className="neu-card"
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'absolute',
              top: 42,
              left: -12,
              width: 290,
              bgcolor: 'var(--neu-surface)',
              borderRadius: '16px',
              boxShadow: 'var(--neu-shadow-floating)',
              border: 'var(--neu-border)',
              p: 2,
              zIndex: 35,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                Add Comment Pin
              </Typography>
              <IconButton size="small" onClick={onCancelPendingPin} sx={{ p: 0.5 }}>
                <CloseOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <TextField
              inputRef={newCommentInputRef}
              multiline
              rows={3}
              placeholder="Leave feedback or architectural note here..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handlePostNew();
                }
              }}
              fullWidth
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  bgcolor: 'var(--neu-bg)',
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'var(--neu-text-muted)', fontSize: '0.68rem' }}>
                ⌘ + Enter to send
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={onCancelPendingPin} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!newCommentText.trim() || isSubmitting}
                  onClick={handlePostNew}
                  className="neu-btn-primary"
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    px: 2,
                  }}
                >
                  Post
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export const CanvasComments = React.memo(CanvasCommentsComponent);
