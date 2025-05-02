import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import QcLabelForm from './QcLabelForm';
import GrnLabelForm from './GrnLabelForm';

export default function PrintLabelPopover() {
  return (
    <Tabs.Root defaultValue="qc" className="flex w-[340px] min-h-[420px]">
      <Tabs.List className="flex flex-col w-32 border-r border-gray-700 bg-[#23263a]">
        <Tabs.Trigger value="qc" className="px-4 py-3 text-base font-semibold text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500">QC Label</Tabs.Trigger>
        <Tabs.Trigger value="grn" className="px-4 py-3 text-base font-semibold text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500">GRN Label</Tabs.Trigger>
      </Tabs.List>
      <div className="flex-1">
        <Tabs.Content value="qc">
          <QcLabelForm />
        </Tabs.Content>
        <Tabs.Content value="grn">
          <GrnLabelForm />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
} 