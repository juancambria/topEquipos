@if(request('column') == $column)
    <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
@else
    <span class="sort-icon">↕</span>
@endif
