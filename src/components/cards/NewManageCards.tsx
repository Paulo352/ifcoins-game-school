import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageCards } from './ManageCards';
import { ExclusiveCardManagement } from './ExclusiveCardManagement';
import { Grid, Crown } from 'lucide-react';

export function NewManageCards() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="normal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="normal" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Cartas Normais
          </TabsTrigger>
          <TabsTrigger value="exclusive" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Cartas Exclusivas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normal">
          <ManageCards />
        </TabsContent>

        <TabsContent value="exclusive">
          <ExclusiveCardManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
