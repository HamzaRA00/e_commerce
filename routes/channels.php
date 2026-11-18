<?php

use App\Enums\RoleEnum;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Customer Order Channel
|--------------------------------------------------------------------------
*/

Broadcast::channel('orders.{orderId}', function (
    User $user,
    int $orderId
) {
    return $user->hasRole(RoleEnum::USER->value)
        && Order::query()
            ->whereKey($orderId)
            ->where('user_id', $user->id)
            ->exists();
});

/*
|--------------------------------------------------------------------------
| Customer Orders Channel
|--------------------------------------------------------------------------
*/

Broadcast::channel('user.{userId}', function (
    User $user,
    int $userId
) {
    return $user->hasRole(RoleEnum::USER->value)
        && (int) $user->id === $userId;
});

/*
|--------------------------------------------------------------------------
| Admin Orders Channel
|--------------------------------------------------------------------------
*/

Broadcast::channel('admin.orders', function (User $user) {
    return $user->hasRole(RoleEnum::ADMIN->value);
});
