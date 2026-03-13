import {
  Container,
  Title,
  Tabs,
  Table,
  Badge,
  Text,
  Button,
  Group,
  ActionIcon,
  Menu,
  Center,
  Loader,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconDots,
  IconTrash,
  IconBan,
  IconGavel,
  IconPlus,
  IconEdit,
  IconUserPlus,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getActiveAuctions,
  getEndedAuctions,
  deleteAuction,
  endAuction,
} from "../helpers";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils";
import { CreateAuctionModal } from "../components/CreateAuctionModal";
import { EditAuctionModal } from "../components/EditAuctionModal";
import { NewAdminModal } from "../components/NewAdminModal";
export { AdminPage };
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [newAdminOpened, { open: openNewAdmin, close: closeNewAdmin }] =
    useDisclosure(false);

  const load = async () => {
    try {
      const [active, ended] = await Promise.all([
        getActiveAuctions(),
        getEndedAuctions(),
      ]);
      setActiveAuctions(active);
      setEndedAuctions(ended);
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!user?.is_admin) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="sm">
          <Text c="dimmed">Access denied. Admins only.</Text>
          <Button variant="subtle" onClick={() => navigate("/")}>
            Go home
          </Button>
        </Stack>
      </Center>
    );
  }

  if (loading) {
    return (
      <Center h="60vh">
        <Loader size="xl" />
      </Center>
    );
  }

  const handleDeleteAuction = async (id) => {
    try {
      await deleteAuction(id);
      notifications.show({
        title: "Auction deleted",
        message: "",
        color: "teal",
      });
      load();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleEndAuction = async (id) => {
    try {
      await endAuction(id);
      notifications.show({
        title: "Auction ended",
        message: "",
        color: "orange",
      });
      load();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleEdit = (auction) => {
    setSelectedAuction(auction);
    openEdit();
  };

  const allAuctions = [...activeAuctions, ...endedAuctions];

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Admin Panel</Title>
        <Group gap="sm">
          <Text c="dimmed" size="sm">
            {allAuctions.length} total auction
            {allAuctions.length !== 1 ? "s" : ""}
          </Text>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            New Auction
          </Button>
          <Button
            variant="light"
            leftSection={<IconUserPlus size={16} />}
            onClick={openNewAdmin}
          >
            New Admin
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="auctions">
        <Tabs.List mb="lg">
          <Tabs.Tab value="auctions">
            All Auctions ({allAuctions.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="auctions">
          {allAuctions.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">No auctions yet</Text>
            </Center>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Seller ID</Table.Th>
                  <Table.Th>End Time</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {allAuctions.map((a) => (
                  <Table.Tr key={a.auction_id}>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        #{a.auction_id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        fw={500}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/auction/${a.auction_id}`)}
                      >
                        {a.title}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={a.is_active ? "teal" : "gray"}
                        variant="light"
                        size="sm"
                      >
                        {a.is_active ? "Active" : "Ended"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {formatPrice(a.current_price ?? a.starting_price)}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        #{a.seller_id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(a.end_time).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size={15} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconGavel size={15} />}
                            onClick={() => navigate(`/auction/${a.auction_id}`)}
                          >
                            View
                          </Menu.Item>
                          {a.is_active && (
                            <Menu.Item
                              leftSection={<IconEdit size={15} />}
                              onClick={() => handleEdit(a)}
                            >
                              Edit
                            </Menu.Item>
                          )}
                          {a.is_active && (
                            <Menu.Item
                              leftSection={<IconBan size={15} />}
                              onClick={() => handleEndAuction(a.auction_id)}
                            >
                              End Auction
                            </Menu.Item>
                          )}
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={15} />}
                            onClick={() => handleDeleteAuction(a.auction_id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <CreateAuctionModal
        opened={createOpened}
        onClose={closeCreate}
        onCreated={load}
      />
      <EditAuctionModal
        opened={editOpened}
        onClose={closeEdit}
        auction={selectedAuction}
        onUpdated={load}
      />
      <NewAdminModal
        opened={newAdminOpened}
        onClose={closeNewAdmin}
      />
    </Container>
  );
};
