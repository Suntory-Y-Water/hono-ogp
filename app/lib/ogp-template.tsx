/**
 * OGP画像生成用JSXテンプレート
 * Satoriで使用するReactコンポーネント形式のテンプレート
 */

import { GRADIENT_PRESETS, type GradientType } from './ogp-generator';

/**
 * OGPテンプレートのプロパティ
 */
export interface OgpTemplateProps {
  title: string;
  gradient: GradientType;
  width?: number;
  height?: number;
  author?: string;
  tags?: string[];
  avatarUrl?: string;
}

/**
 * メインのOGPテンプレートコンポーネント
 */
export function createOgpTemplate(props: OgpTemplateProps) {
  const {
    title,
    gradient,
    width = 1200,
    height = 630,
    author,
    tags = [],
    avatarUrl,
  } = props;

  const gradientStyle = GRADIENT_PRESETS[gradient] || GRADIENT_PRESETS['blue-to-purple'];

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        padding: 48,
        height: height,
        width: width,
        background: gradientStyle,
        fontFamily: 'Noto Sans JP, system-ui, sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              height: '100%',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              backgroundColor: 'white',
              color: '#1a1a1a',
              padding: 48,
              borderRadius: 12,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            children: [
              // メインコンテンツエリア
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  },
                  children: [
                    // タイトル
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: Math.min(64, Math.max(32, 800 / title.length)),
                          maxWidth: width - 192, // padding考慮
                          fontWeight: 700,
                          lineHeight: 1.2,
                          color: '#1a1a1a',
                          marginBottom: tags.length > 0 ? 24 : 0,
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        },
                        children: title,
                      },
                    },
                    // タグエリア（Phase 2）
                    ...(tags.length > 0 ? [{
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          marginTop: 12,
                          flexWrap: 'wrap',
                          gap: 12,
                        },
                        children: tags.slice(0, 3).map((tag: string) => ({
                          type: 'div',
                          props: {
                            style: {
                              fontSize: 20,
                              fontWeight: 500,
                              border: '2px solid #e5e7eb',
                              backgroundColor: '#f9fafb',
                              color: '#374151',
                              padding: '8px 16px',
                              borderRadius: 20,
                            },
                            children: tag,
                          },
                        })),
                      },
                    }] : []),
                  ],
                },
              },
              // フッターエリア（著者情報）
              ...(author ? [{
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: 24,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 32,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#374151',
                        },
                        children: [
                          // アバター画像（Phase 2）
                          ...(avatarUrl ? [{
                            type: 'img',
                            props: {
                              src: avatarUrl,
                              width: 48,
                              height: 48,
                              alt: 'avatar',
                              style: {
                                borderRadius: 24,
                                marginRight: 16,
                                border: '2px solid #e5e7eb',
                              },
                            },
                          }] : []),
                          author,
                        ],
                      },
                    },
                    // サイト名やロゴエリア
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 24,
                          fontWeight: 600,
                          color: '#6b7280',
                        },
                        children: 'OGP Generator',
                      },
                    },
                  ],
                },
              }] : []),
            ],
          },
        },
      ],
    },
  };
}

/**
 * シンプルなOGPテンプレート（Phase 1用）
 * サンプル通りの「グラデーション背景 + 白いカードコンテナ」構造
 */
export function createSimpleOgpTemplate(props: Pick<OgpTemplateProps, 'title' | 'gradient' | 'width' | 'height'>) {
  const { title, gradient, width = 1200, height = 630 } = props;
  const gradientStyle = GRADIENT_PRESETS[gradient] || GRADIENT_PRESETS['blue-to-purple'];

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        padding: 48,
        height: height,
        width: width,
        background: gradientStyle,
        fontFamily: 'Noto Sans JP, system-ui, sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              height: '100%',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              backgroundColor: 'white',
              color: '#000000d1',
              padding: 48,
              borderRadius: 12,
            },
            children: [
              // メインコンテンツエリア
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  children: [
                    // タイトル
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 64,
                          maxWidth: 1000,
                          fontWeight: 600,
                        },
                        children: title,
                      },
                    },
                  ],
                },
              },
              // フッターエリア（著者情報）
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 48,
                          fontWeight: 400,
                          display: 'flex',
                          alignItems: 'center',
                        },
                        children: 'OGP Generator',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * エラー用フォールバックテンプレート
 */
export function createErrorTemplate(params: {
  message?: string;
  width?: number;
  height?: number;
}) {
  const { message = 'エラーが発生しました', width = 1200, height = 630 } = params;

  return {
    type: 'div',
    props: {
      style: {
        height: height,
        width: width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontSize: 32,
        color: '#374151',
        fontFamily: 'system-ui, sans-serif',
        flexDirection: 'column',
        gap: 16,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: 48,
              fontWeight: 600,
              color: '#ef4444',
            },
            children: '⚠️',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              textAlign: 'center',
              maxWidth: '80%',
            },
            children: message,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 24,
              color: '#6b7280',
            },
            children: 'OGP Generator',
          },
        },
      ],
    },
  };
}

/**
 * テンプレート選択ヘルパー関数
 */
export function selectTemplate(props: OgpTemplateProps & { useSimple?: boolean }) {
  const { useSimple = true, ...templateProps } = props;

  if (useSimple) {
    return createSimpleOgpTemplate(templateProps);
  }

  return createOgpTemplate(templateProps);
}

/**
 * タイトルの長さに基づく推奨テンプレート選択
 */
export function getRecommendedTemplate(props: OgpTemplateProps) {
  // Phase 1では常にシンプルテンプレートを使用
  // Phase 2で高度なテンプレートを追加予定
  const useSimple = props.title.length > 50 || !props.author;

  return selectTemplate({ ...props, useSimple });
}