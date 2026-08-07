import { Switch } from "@/components/ui/switch"

export function QualifiedToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      Qualified (900+ min)
    </label>
  )
}
