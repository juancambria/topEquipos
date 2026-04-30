<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreserveWindowQueryOnRedirect
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!($response instanceof RedirectResponse) || !$request->boolean('window')) {
            return $response;
        }

        $targetUrl = $response->getTargetUrl();
        $parts = parse_url($targetUrl);
        if ($parts === false) {
            return $response;
        }

        $queryParams = [];
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $queryParams);
        }

        $queryParams['window'] = '1';
        $newQuery = http_build_query($queryParams);

        $rebuiltUrl = '';
        if (isset($parts['scheme'])) {
            $rebuiltUrl .= $parts['scheme'] . '://';
        }
        if (isset($parts['user'])) {
            $rebuiltUrl .= $parts['user'];
            if (isset($parts['pass'])) {
                $rebuiltUrl .= ':' . $parts['pass'];
            }
            $rebuiltUrl .= '@';
        }
        if (isset($parts['host'])) {
            $rebuiltUrl .= $parts['host'];
        }
        if (isset($parts['port'])) {
            $rebuiltUrl .= ':' . $parts['port'];
        }

        $rebuiltUrl .= $parts['path'] ?? '';
        if ($newQuery !== '') {
            $rebuiltUrl .= '?' . $newQuery;
        }
        if (isset($parts['fragment'])) {
            $rebuiltUrl .= '#' . $parts['fragment'];
        }

        $response->setTargetUrl($rebuiltUrl);

        return $response;
    }
}
