
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManagement } from '@/hooks/useEventManagement';
import { EventForm } from '@/components/events/EventForm';
import { EventsList } from '@/components/events/EventsList';
import { EventsHeader } from '@/components/events/EventsHeader';
import { Polls } from '@/components/sections/Polls';
import { PollIndicator } from '@/components/events/PollIndicator';
import { Event } from '@/types/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Events() {
  const { profile } = useAuth();
  const {
    events,
    isLoading,
    loading,
    createEvent,
    updateEvent,
    deleteEvent
  } = useEventManagement();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const isAdmin = profile?.role === 'admin';

  const handleCreateEvent = async (eventData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    bonus_multiplier: number;
  }) => {
    const success = await createEvent(eventData);
    if (success) {
      setIsCreating(false);
    }
    return success;
  };

  const handleUpdateEvent = async (eventData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    bonus_multiplier: number;
  }) => {
    if (!editingEvent) return false;
    
    const success = await updateEvent(editingEvent.id, eventData);
    if (success) {
      setEditingEvent(null);
    }
    return success;
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este evento?')) {
      await deleteEvent(eventId);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsCreating(false);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Eventos e Votações</h1>
        <p className="text-muted-foreground">
          Gerencie eventos e participe das votações da comunidade
        </p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="polls" className="flex items-center gap-2">
            Votações
            <PollIndicator />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-6">
          <EventsHeader
            isAdmin={isAdmin}
            onCreateEvent={() => setIsCreating(true)}
            disabled={isCreating || editingEvent !== null}
          />

          {(isCreating || editingEvent) && isAdmin && (
            <EventForm
              event={editingEvent}
              onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
              onCancel={handleCancelForm}
              loading={loading}
            />
          )}

          <EventsList
            events={events}
            isLoading={isLoading}
            isAdmin={isAdmin}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        </TabsContent>
        
        <TabsContent value="polls">
          <Polls />
        </TabsContent>
      </Tabs>
    </div>
  );
}
