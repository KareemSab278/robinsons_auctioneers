import { Modal, TextInput, Textarea, Button, Stack, Group } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { updateAuction } from '../helpers';
export { EditAuctionModal };
const EditAuctionModal = ({ opened, onClose, auction, onUpdated }) => {
  const form = useForm({
    initialValues: { title: '', description: '', end_time: null },
    validate: {
      title: (val) =>
        val.trim().length < 3 ? 'Title must be at least 3 characters' : null,
      end_time: (val) => (!val ? 'End time is required' : null),
    },
  });

  useEffect(() => {
    if (auction) {
      form.setValues({
        title: auction.title ?? '',
        description: auction.description ?? '',
        end_time: auction.end_time ? new Date(auction.end_time) : null,
      });
    }
  }, [auction]);

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      await updateAuction(auction.auction_id, {
        ...values,
        end_time: values.end_time?.toISOString(),
      });
      notifications.show({
        title: 'Auction updated',
        message: 'Your changes have been saved',
        color: 'teal',
      });
      onUpdated?.();
      onClose();
    } catch (err) {
      notifications.show({ title: 'Update failed', message: err.message, color: 'red' });
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Auction" size="md" centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="Item name"
            {...form.getInputProps('title')}
          />
          <Textarea
            label="Description"
            placeholder="Describe the item..."
            rows={3}
            {...form.getInputProps('description')}
          />
          <DateTimePicker
            label="End Time"
            placeholder="Pick end date and time"
            {...form.getInputProps('end_time')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
