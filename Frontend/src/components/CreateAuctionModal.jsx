import { Modal, TextInput, Textarea, NumberInput, Button, Stack, Group } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createAuction } from '../helpers';
import { useAuth } from '../context/AuthContext';

const CreateAuctionModal = ({ opened, onClose, onCreated }) => {
  const { user } = useAuth();

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      starting_price: 1,
      end_time: null,
    },
    validate: {
      title: (val) =>
        val.trim().length < 3 ? 'Title must be at least 3 characters' : null,
      starting_price: (val) => (val <= 0 ? 'Starting price must be positive' : null),
      end_time: (val) => {
        if (!val) return 'End time is required';
        if (val <= new Date()) return 'End time must be in the future';
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    const end_time = new Date(values.end_time);
    try {
      await createAuction({
        ...values,
        seller_id: user.account_id || user.admin_id,
        end_time: end_time.toISOString(),
      });
      notifications.show({
        title: 'Auction created!',
        message: 'Your auction is now live',
        color: 'teal',
      });
      form.reset();
      onCreated?.();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Failed to create auction',
        message: err.message,
        color: 'red',
      });
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Auction" size="md" centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="What are you selling?"
            {...form.getInputProps('title')}
          />
          <Textarea
            label="Description"
            placeholder="Describe the item..."
            rows={3}
            {...form.getInputProps('description')}
          />
          <NumberInput
            label="Starting Price (GBP)"
            min={0.01}
            step={1}
            prefix="£"
            decimalScale={2}
            {...form.getInputProps('starting_price')}
          />
          <DateTimePicker
            label="End Time"
            placeholder="Pick end date and time"
            minDate={new Date()}
            {...form.getInputProps('end_time')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Auction</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
export {CreateAuctionModal}