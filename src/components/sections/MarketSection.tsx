import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IFMarket } from '@/components/market/IFMarket';
import { MyListings } from '@/components/market/MyListings';
import { ShoppingBag, Package } from 'lucide-react';

export function MarketSection() {
  return (
    <Tabs defaultValue="market" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="market" className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Marketplace
        </TabsTrigger>
        <TabsTrigger value="my-listings" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Meus Anúncios
        </TabsTrigger>
      </TabsList>
      <TabsContent value="market" className="mt-6">
        <IFMarket />
      </TabsContent>
      <TabsContent value="my-listings" className="mt-6">
        <MyListings />
      </TabsContent>
    </Tabs>
  );
}
