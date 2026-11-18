<?php

namespace App\Http\Controllers\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\User\UserProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Services\Warehouse\WarehouseClient;
use App\Services\Warehouse\WarehouseUnavailableException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UserProductController extends Controller
{
    
public function index(Request $request, Category $category, WarehouseClient $warehouse): JsonResponse
{
    $name = $request->string('name')->trim()->toString();
    $page = $request->integer('page', 1);

    $cacheKey = 'category:'.$category->id
        .':locale:'.app()->getLocale()
        .':name:'.md5($name)
        .':page:'.$page;

    $cached = Cache::tags(['products'])->remember(
        $cacheKey,
        now()->addMinutes(10),
        function () use ($category, $name, $page) {
            $query = $category->products()
                ->with(['category', 'images'])
                ->latest();

            if ($name !== '') {
                $query->where(
                    'name_'.app()->getLocale(),
                    'like',
                    '%'.$name.'%'
                );
            }

            $paginator = $query->paginate(5, ['*'], 'page', $page);

            return [
                'products' => $paginator->getCollection()
                    ->map(fn (Product $product) => $product->toArray())
                    ->all(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ];
        }
    );

    $products = collect($cached['products'])
        ->map(fn (array $item) => (new Product())->forceFill($item));

    $unavailable = false;

    $products->transform(function (Product $product) use ($warehouse, &$unavailable) {
        $quantity = null;

        if (! $unavailable) {
            try {
                $quantity = $warehouse->getQuantity($product->id);
            } catch (WarehouseUnavailableException) {
                $unavailable = true;
            }
        }

        $product->setAttribute('available_quantity', $quantity);

        return $product;
    });

    return $this->succeed(__('Category products fetched successfully'), [
        'products' => UserProductResource::collection($products),
        'stock_message' => $unavailable
            ? __('Stock information is temporarily unavailable')
            : null,
        'meta' => [
            'current_page' => $cached['current_page'],
            'last_page' => $cached['last_page'],
            'total' => $cached['total'],
        ],
    ]);
}


    

    public function show(Product $product, WarehouseClient $warehouse): JsonResponse
    {
        $data = (new UserProductResource($product->load(['category', 'images'])))->resolve();

        try {
         $data['available_quantity'] = $warehouse->getQuantity($product->id);
        } catch (WarehouseUnavailableException) {
            $data['available_quantity'] = null;
            $data['stock_message'] = __('Stock information is temporarily unavailable');
        }

        $response = $this->succeed(__('Product fetched successfully'), $data);

        $response->setEtag(hash('sha256', $response->getContent()));
        $response->isNotModified(request());

        return $response;
    }

}
