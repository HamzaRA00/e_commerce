<?php

namespace Tests\Unit;

use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use PHPUnit\Framework\TestCase;

class RealtimeContractTest extends TestCase
{
    public function test_order_created_broadcasts_to_the_customer_and_admin_channels(): void
    {
        $event = new OrderCreated(orderId: 12, userId: 7, status: 'pending');

        $channels = array_map(
            fn ($channel) => $channel->name,
            $event->broadcastOn()
        );

        $this->assertSame(['private-user.7', 'private-admin.orders'], $channels);
        $this->assertSame('order.created', $event->broadcastAs());
        $this->assertSame([
            'order_id' => 12,
            'user_id' => 7,
            'status' => 'pending',
        ], $event->broadcastWith());
    }

    public function test_order_status_updated_broadcasts_to_order_customer_and_admin_channels(): void
    {
        $event = new OrderStatusUpdated(orderId: 12, userId: 7, status: 'shipped');

        $channels = array_map(
            fn ($channel) => $channel->name,
            $event->broadcastOn()
        );

        $this->assertSame(['private-orders.12', 'private-user.7', 'private-admin.orders'], $channels);
        $this->assertSame('order.status.updated', $event->broadcastAs());
    }
}
