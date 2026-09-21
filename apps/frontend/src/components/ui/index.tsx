// FILE: src/components/ui/index.tsx
// Barrel — the single import surface for the design system.
// Consumers: `import { Button, Card, Input, Badge, Modal } from '@/components/ui'`.

// Layout primitives
export { Container, Stack } from './layout';
export { PageShell } from './PageShell';

// Actions & display
export { Button } from './Button';
export { Spinner } from './Spinner';
export { Card } from './Card';
export { Badge } from './Badge';
export { Avatar } from './Avatar';

// Form fields
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Radio } from './Radio';
export { Switch } from './Switch';
export { FieldShell, focusHandlers, fieldBaseStyle } from './forms';

// Feedback & loading
export { PageHeader, EmptyState, Alert } from './feedback';
export { SkeletonLine, SkeletonCard } from './Skeleton';
export { Tooltip } from './Tooltip';

// Overlays
export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { ToastProvider, useToast } from './Toast';

// Navigation & data
export { Tabs } from './Tabs';
export type { TabItem } from './Tabs';
export { ActionsMenu } from './ActionsMenu';
export type { ActionsMenuItem } from './ActionsMenu';
export { Table } from './Table';
export type { Column } from './Table';

// Logo helpers
