import { componentPropsTypeName } from '../../../../src/plugins/react/rules/component-props-type.ts';
import { error, invalidWith, validWith } from '../../lib/cases.ts';
import { runReactRule } from './harness.ts';

const propsAndComponent = `type MetricCardProps = { title: string };
function MetricCard(props: MetricCardProps) { return null; }`;

runReactRule(componentPropsTypeName, {
  valid: [
    validWith(propsAndComponent, { filename: 'metric-card.tsx' }),
    validWith(
      'interface MetricCardProps { title: string }\nfunction MetricCard({ title }: MetricCardProps) { return null; }',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps = { title: string };\nconst MetricCard = (props: MetricCardProps) => null;',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps = { title: string };\nconst MetricCard = memo((props: MetricCardProps) => null);',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps = { title: string };\nconst MetricCard = forwardRef<HTMLDivElement, MetricCardProps>((props, _ref) => null);',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps = { title: string };\nconst MetricCard = memo(forwardRef<HTMLDivElement, MetricCardProps>((props, _ref) => null));',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'export type MetricCardProps = { title: string };\nexport function MetricCard(props: MetricCardProps) { return null; }',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps = { title: string };\nconst MetricCard: FC<MetricCardProps> = (props) => null;',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps<T> = { value: T };\nfunction MetricCard<T>(props: MetricCardProps<T>) { return null; }',
      { filename: 'metric-card.tsx' },
    ),
    validWith(
      'type MetricCardProps = { title: string };\nfunction MetricCard(props: MetricCardProps) { return null; }\nfunction MetricCardProvider() { return null; }',
      { filename: 'metric-card.tsx' },
    ),
    validWith('function MetricCard() { return null; }', { filename: 'metric-card.jsx' }),
    validWith('function MetricCard() { return null; }', { filename: 'metric-card.test.tsx' }),
    validWith('function MetricCard() { return null; }', {
      filename: 'metric-card.tsx',
      options: [{ allow: ['metric-card.tsx'] }],
    }),
    validWith('function useMetric() { return null; }', { filename: 'use-metric.tsx' }),
  ],
  invalid: [
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'function MetricCard() { return null; }',
      errors: [error('missing')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'function MetricCard(props: { title: string }) { return null; }',
      errors: [error('missing')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'type Props = { title: string };\nfunction MetricCard(props: Props) { return null; }',
      errors: [error('extraType'), error('wrongName')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'import type { MetricCardProps } from "./types";\nfunction MetricCard(props: MetricCardProps) { return null; }',
      errors: [error('missingLocal')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'type MetricCardProps = {};\nfunction MetricCard(props: MetricCardProps) { return null; }',
      errors: [error('empty')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'interface MetricCardProps {}\nfunction MetricCard(props: MetricCardProps) { return null; }',
      errors: [error('empty')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'type Title = string;\ntype MetricCardProps = { title: Title };\nfunction MetricCard(props: MetricCardProps) { return null; }',
      errors: [error('extraType')],
    }),
    invalidWith({
      filename: 'metric-card.tsx',
      code: 'const MetricCard = () => null;',
      errors: [error('missing')],
    }),
  ],
});
