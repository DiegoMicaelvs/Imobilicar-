import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ChecklistItem {
  checked: boolean;
  notes?: string;
}

interface ChecklistRendererProps {
  title: string;
  items: string[];
  checklist: Record<string, ChecklistItem>;
  onChecklistChange: (updatedChecklist: Record<string, ChecklistItem>) => void;
}

export default function ChecklistRenderer({
  title,
  items,
  checklist,
  onChecklistChange
}: ChecklistRendererProps) {
  const handleCheckChange = (item: string, checked: boolean) => {
    onChecklistChange({
      ...checklist,
      [item]: { ...checklist[item], checked }
    });
  };

  const handleNotesChange = (item: string, notes: string) => {
    onChecklistChange({
      ...checklist,
      [item]: { ...checklist[item], notes }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
            <input
              type="checkbox"
              checked={checklist[item]?.checked ?? true}
              onChange={(e) => handleCheckChange(item, e.target.checked)}
              className="mt-1 w-4 h-4 cursor-pointer"
              data-testid={`checkbox-${item.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <div className="flex-1">
              <p className="font-medium">{item}</p>
              {!checklist[item]?.checked && (
                <Input
                  placeholder="Observações sobre o problema..."
                  value={checklist[item]?.notes || ""}
                  onChange={(e) => handleNotesChange(item, e.target.value)}
                  className="mt-2"
                  data-testid={`input-notes-${item.toLowerCase().replace(/\s+/g, '-')}`}
                />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
