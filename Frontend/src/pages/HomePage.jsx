import {
  Container,
  Title,
  Text,
  TextInput,
  Select,
  Group,
  Stack,
  Loader,
  Center,
  Tabs,
  SimpleGrid,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {AuctionCard} from '../components/AuctionCard';
import { getActiveAuctions, getEndedAuctions } from '../helpers';
export { HomePage };
const HomePage = () => {
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('end_time');

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const [active, ended] = await Promise.all([getActiveAuctions(), getEndedAuctions()]);
        setActiveAuctions(active);
        setEndedAuctions(ended);
      } catch (err) {
        notifications.show({ title: 'Error loading auctions', message: err.message, color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  function filterAndSort(auctions) {
    return auctions
      .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const priceA = a.current_price ?? a.starting_price;
        const priceB = b.current_price ?? b.starting_price;
        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        return new Date(a.end_time) - new Date(b.end_time);
      });
  }

  if (loading) {
    return (
      <Center h="60vh">
        <Loader size="xl" />
      </Center>
    );
  }

  const filteredActive = filterAndSort(activeAuctions);
  const filteredEnded = filterAndSort(endedAuctions);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xs" mb="xl">
        <Title order={2}>Live Auctions</Title>
        <Text c="dimmed">Discover and bid on exclusive items</Text>
      </Stack>

      <Group mb="xl" gap="sm">
        <TextInput
          placeholder="Search auctions..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Sort by"
          value={sortBy}
          onChange={(v) => setSortBy(v ?? 'end_time')}
          data={[
            { value: 'end_time', label: 'Ending Soon' },
            { value: 'price_asc', label: 'Price: Low → High' },
            { value: 'price_desc', label: 'Price: High → Low' },
          ]}
          w={190}
        />
      </Group>

      <Tabs defaultValue="active">
        <Tabs.List mb="lg">
          <Tabs.Tab value="active">Active ({filteredActive.length})</Tabs.Tab>
          <Tabs.Tab value="ended">Ended ({filteredEnded.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active">
          {filteredActive.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">No active auctions found</Text>
            </Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {filteredActive.map((a) => (
                <AuctionCard key={a.auction_id} auction={a} />
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="ended">
          {filteredEnded.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">No ended auctions found</Text>
            </Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {filteredEnded.map((a) => (
                <AuctionCard key={a.auction_id} auction={a} />
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
