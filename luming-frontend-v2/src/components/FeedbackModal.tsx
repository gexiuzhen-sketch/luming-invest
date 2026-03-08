import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Star, CheckCircle } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
}

export interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  rating: number;
  content: string;
  contact?: string;
}

export function FeedbackModal({ onClose, onSubmit }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('improvement');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { key: 'bug' as const, label: 'Bug反馈', emoji: '🐛' },
    { key: 'feature' as const, label: '功能建议', emoji: '💡' },
    { key: 'improvement' as const, label: '改进建议', emoji: '✨' },
    { key: 'other' as const, label: '其他', emoji: '💬' },
  ];

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit({
      type: feedbackType,
      rating,
      content: content.trim(),
      contact: contact.trim() || undefined,
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (submitted) {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            background: '#1a1b26',
            borderRadius: 20,
            padding: 40,
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <CheckCircle size={64} style={{ color: '#22c55e', marginBottom: 20 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
            感谢您的反馈！
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            我们会认真对待每一条建议
          </p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1b26',
          borderRadius: 20,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={24} style={{ color: '#fbbf24' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
              意见反馈
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Introduction */}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
          鹿鸣智投还在早期阶段，您的每一条反馈都能帮助我们做得更好。期待听到您的真实声音！
        </p>

        {/* Scrollable Content Area */}
        <div style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(85vh - 180px)',
          paddingRight: 4,
          marginBottom: 4,
        }}>
          {/* Feedback Type */}
          <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'block' }}>
            反馈类型
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {feedbackTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setFeedbackType(type.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${feedbackType === type.key ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: feedbackType === type.key ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: feedbackType === type.key ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                }}
              >
                <span>{type.emoji}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'block' }}>
            您的评分
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Star
                  size={28}
                  fill={star <= rating ? '#fbbf24' : 'none'}
                  color={star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                  style={{ transition: 'all 0.2s' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'block' }}>
            详细描述 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请详细描述您遇到的问题或建议..."
            style={{
              width: '100%',
              minHeight: 120,
              padding: 12,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#fff',
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'block' }}>
            联系方式（可选）
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="微信号/手机号/邮箱"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        </div>

        {/* Submit Button - Always Visible */}
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: content.trim()
                ? 'linear-gradient(135deg, #fbbf24, #f97316)'
                : 'rgba(255, 255, 255, 0.1)',
              color: content.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: 15,
              fontWeight: 700,
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <Send size={18} />
            提交反馈
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
