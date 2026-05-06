<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar sesión - Inventario</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/toast.css') }}">
    <style>
        .login-container {
            width: 100%;
            max-width: 420px;
            margin: 80px auto;
            background: #fff;
            padding: 24px;
            border: 1px solid #999;
            border-radius: 8px;
            box-shadow: 0 0 14px rgba(0,0,0,.12);
        }
        .login-container h2 { margin: 0 0 14px; }
        .login-field { margin-bottom: 12px; }
        .login-field label { display: block; margin-bottom: 4px; font-weight: bold; }
        .login-field input { width: 100%; padding: 8px; border: 1px solid #999; border-radius: 4px; }
        .login-actions button { width: 100%; padding: 10px; font-weight: bold; border: 1px solid #666; background: #ddd; }
        .login-actions button:hover { background: #ccc; }
        .text-center { text-align: center; }
        
        /* Fix alineación checkbox Recordarme */
        .login-field:has(input[type="checkbox"]) label {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }
        .login-field:has(input[type="checkbox"]) input[type="checkbox"] {
            width: auto !important;
            margin-right: 8px;
            margin-bottom: 0;
            margin-left: 0;
        }
    </style>
</head>
<body style="background:#cfcfcf;">
<div class="login-container">
    <h2 class="text-center">Iniciar sesión</h2>

    <form method="POST" action="{{ route('login.submit') }}">
        @csrf
        <div class="login-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required value="{{ old('email') }}" autofocus>
        </div>

        <div class="login-field">
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" required>
        </div>

        <div class="login-field">
            <label><input type="checkbox" name="remember"> Recordarme</label>
        </div>

        <div class="login-actions">
            <button type="submit">Entrar</button>
        </div>
    </form>
</div>

@if(session('success'))
    <div id="loginSuccessData" data-message="{{ session('success') }}" hidden></div>
@endif

@if($errors->any())
    <script id="loginErrorsData" type="application/json">
        @json($errors->all())
    </script>
@endif

<script src="{{ asset('js/toast.js') }}?v={{ time() }}"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        var successNode = document.getElementById('loginSuccessData');
        if (successNode && successNode.dataset.message) {
            mostrarToast(successNode.dataset.message, 'success');
        }

        var errorsNode = document.getElementById('loginErrorsData');
        if (!errorsNode) {
            return;
        }

        try {
            var erroresLogin = JSON.parse(errorsNode.textContent || '[]');
            erroresLogin.forEach(function(errorMsg) {
                mostrarToast(errorMsg, 'error');
            });
        } catch (e) {
            console.error('No se pudieron procesar los errores de login.', e);
        }
    });
</script>
</body>
</html>
