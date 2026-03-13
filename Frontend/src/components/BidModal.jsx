import { Modal, NumberInput, Button, Stack, Text, Divider, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { placeBid } from '../helpers';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils';
export { BidModal };
const BidModal = ({ opened, onClose, auction, onBidPlaced }) => {
  const { user } = useAuth();
  const minBid = (auction?.current_price ?? auction?.starting_price ?? 0) + 0.01;

  const form = useForm({
    initialValues: { bid_amount: minBid },
    validate: {
      bid_amount: (val) =>
        val < minBid ? `Bid must be at least ${formatPrice(minBid)}` : null,
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      await placeBid({
        auction_id: auction.auction_id,
        bidder_id: user.account_id,
        bid_amount: values.bid_amount,
      });
      notifications.show({
        title: 'Bid placed!',
        message: `You bid ${formatPrice(values.bid_amount)}`,
        color: 'teal',
      });
      onBidPlaced?.();
      onClose();
      form.reset();
    } catch (err) {
      notifications.show({ title: 'Bid failed', message: err.message, color: 'red' });
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Place a Bid" centered size="sm">
      <Stack gap="sm">
        <Text size="sm">
          Auction: <strong>{auction?.title}</strong>
        </Text>
        <Text size="sm">
          Current price:{' '}
          <strong>
            {formatPrice(auction?.current_price ?? auction?.starting_price ?? 0)}
          </strong>
        </Text>
        <Divider />
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <NumberInput
              label="Your Bid (GBP)"
              placeholder={minBid.toFixed(2)}
              min={minBid}
              step={1}
              prefix="£"
              decimalScale={2}
              {...form.getInputProps('bid_amount')}
            />
            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Place Bid</Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
