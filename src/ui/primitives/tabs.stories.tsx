import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = { title: 'ui/Tabs', component: Tabs } satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="lines" className="w-72">
      <TabsList>
        <TabsTrigger value="lines">Lines</TabsTrigger>
        <TabsTrigger value="eval">Evaluation</TabsTrigger>
      </TabsList>
      <TabsContent value="lines">Candidate lines appear here.</TabsContent>
      <TabsContent value="eval">Evaluation graph appears here.</TabsContent>
    </Tabs>
  ),
}
