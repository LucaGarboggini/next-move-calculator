import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const meta = { title: 'ui/Select', component: Select } satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const items = (
  <SelectContent position="popper">
    <SelectItem value="lite">Lite</SelectItem>
    <SelectItem value="full">Full (~94 MB)</SelectItem>
  </SelectContent>
)

export const Default: Story = {
  render: () => (
    <Select defaultValue="lite">
      <SelectTrigger aria-label="Engine size">
        <SelectValue />
      </SelectTrigger>
      {items}
    </Select>
  ),
}

export const Open: Story = {
  // Radix hides the page behind an open Select while its trigger stays focusable.
  parameters: { a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } } },
  render: () => (
    <Select defaultValue="lite" open>
      <SelectTrigger aria-label="Engine size">
        <SelectValue />
      </SelectTrigger>
      {items}
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select defaultValue="lite" disabled>
      <SelectTrigger aria-label="Engine size">
        <SelectValue />
      </SelectTrigger>
      {items}
    </Select>
  ),
}
