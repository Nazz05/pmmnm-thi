<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'PENDING';
    case CONFIRMED = 'CONFIRMED';
    case SHIPPED = 'SHIPPED';
    case DELIVERED = 'DELIVERED';
    case CANCELLED = 'CANCELLED';
}
