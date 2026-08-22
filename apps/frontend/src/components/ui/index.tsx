// FILE: src/components/ui/index.tsx
// Barrel — the single import surface for the design system.
// Consumers: `import { Button, Card, Input, Badge, Modal } from '@/components/ui'`.

// Layout primitives
export { Container, Stack, Divider } from './layout';

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
export type { SelectOption } from './Select';
export { Checkbox } from './Checkbox';
export { Radio } from './Radio';
export type { RadioOption } from './Radio';
export { Switch } from './Switch';
export { Label, FormField, FieldShell, focusHandlers, fieldBaseStyle } from './forms';

// Feedback & loading
export { PageHeader, EmptyState, Alert, StatCard } from './feedback';
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
export { Stepper } from './Stepper';
export type { Step } from './Stepper';
export { FileUpload } from './FileUpload';

// Logo helpers
export * from './LogoImg';
