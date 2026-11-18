<?php

namespace Tests\Unit;

use App\DTOs\V1\AuthInfoDTO;
use PHPUnit\Framework\TestCase;

class AuthInfoDTOTest extends TestCase
{
    public function test_it_exposes_user_id_in_the_array_payload(): void
    {
        $dto = new AuthInfoDTO(
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            device: 'web-device',
            user_id: 42
        );

        $this->assertSame([
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
            'device' => 'web-device',
            'user_id' => 42,
        ], $dto->toArray());
    }

    public function test_it_omits_optional_values_that_are_null(): void
    {
        $dto = new AuthInfoDTO(
            access_token: 'access-token',
            refresh_token: 'refresh-token'
        );

        $this->assertSame([
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
        ], $dto->toArray());
    }
}
