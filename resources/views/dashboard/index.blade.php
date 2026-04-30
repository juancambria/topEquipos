@extends('layouts.dashboard')

@section('title', 'Inicio')

@section('content')
    <div class="dashboard-home">
        <h1>Bienvenido {{ auth()->user()->name ?? auth()->user()->email ?? 'Usuario' }}</h1>
        <p>Has iniciado sesión correctamente. Aquí está tu panel de control inicial.</p>
        <img src="{{ asset('storage/logo/logoTop.png') }}" alt="Logo Top">
    </div>
@endsection
