<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $orderId,
        public string $status,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('Order created'))
            ->greeting(__('Hello :name', ['name' => $notifiable->name ?? '']))
            ->line(__('Your order #:id has been created successfully.', ['id' => $this->orderId]))
            ->line(__('Current status: :status', ['status' => $this->status]))
            ->line(__('Thank you for shopping with us.'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->orderId,
            'status' => $this->status,
        ];
    }
}
