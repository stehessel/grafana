import { StandardEditorProps } from '@grafana/data';
import { Switch } from '@grafana/ui';
import React from 'react';

export function PaginationEditor({ onChange, value, context }: StandardEditorProps<boolean>) {
  const changeValue = (event: React.FormEvent<HTMLInputElement> | undefined) => {
    if (event?.currentTarget.checked) {
      context.options.footer.show = false;
    }
    onChange(event?.currentTarget.checked);
  };

  return <Switch value={Boolean(value)} onChange={changeValue} />;
}
