<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function applySearchAndSorting(
        Request $request,
        $query,
        ?string $searchColumn,
        array $allowedColumns,
        string $defaultColumn
    ): void {
        if ($searchColumn && $request->filled('search')) {
            $query->where($searchColumn, 'like', '%' . $request->input('search') . '%');
        }

        $column = $request->input('column', $defaultColumn);
        $order = $request->input('order', 'asc');

        if (!in_array($column, $allowedColumns, true)) {
            $column = $defaultColumn;
        }

        $query->orderBy($column, in_array($order, ['asc', 'desc'], true) ? $order : 'asc');
    }

    protected function cleanString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = preg_replace('/\s+/u', ' ', trim($value));

        return $value === '' ? null : $value;
    }

    protected function cleanUpperString(?string $value): ?string
    {
        $value = $this->cleanString($value);

        return $value === null ? null : mb_strtoupper($value);
    }

    protected function cleanTextarea(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = str_replace(["\r\n", "\r"], "\n", trim($value));

        return $value === '' ? null : $value;
    }

    protected function cleanEmail(?string $value): ?string
    {
        $value = $this->cleanString($value);

        return $value === null ? null : mb_strtolower($value);
    }

    protected function cleanDigits(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = preg_replace('/\D+/', '', $value);

        return $value === '' ? null : $value;
    }

    protected function cleanPhone(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = preg_replace('/[^0-9+\-().\s]/', '', trim($value));
        $value = preg_replace('/\s+/u', ' ', $value);

        return $value === '' ? null : $value;
    }

    protected function mergeCleaned(Request $request, array $data): void
    {
        $request->merge($data);
    }
}
