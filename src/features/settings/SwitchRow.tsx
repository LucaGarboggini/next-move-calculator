import { useId } from 'react'
import { Label, Switch } from '@/ui'

export interface SwitchRowProps {
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** A labelled switch whose whole row is the tap target, so it is easy to hit on touch screens. */
export function SwitchRow({ label, hint, checked, onCheckedChange }: SwitchRowProps) {
  const id = useId()
  return (
    <Label htmlFor={id} className="min-h-touch w-full items-start justify-between gap-3">
      <span className="flex flex-col gap-0.5">
        <span id={`${id}-label`}>{label}</span>
        <span id={`${id}-hint`} className="text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
      />
    </Label>
  )
}
