<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TemplateController extends Controller
{
    public function index()
    {
        $key = '519fbdfe07dddde829aa7376bb2e985b';
        $domainYogyakarta = 3400;
        $domainBantul = 3402;
        $page = 1;
        $strategicData = [];

        $url = "https://webapi.bps.go.id/v1/api/list/?key={$key}&model=indicators&domain={$domainYogyakarta}&page={$page}";
        $response = Http::get($url);
        Log::info("Requesting page: {$page}"); // Log untuk debugging       

        if($response->successful()){
            $data = json_decode($response->getBody(), true);
            $strategicDataRaw = $data['data'][1];
            foreach($strategicDataRaw as $dt){
                $strategicData[] = $dt;
            }
        }

        // Infografis
        $infografis = []; // Inphographic
        $urlInphographic = "https://webapi.bps.go.id/v1/api/list/?model=infographic&domain={$domainBantul}&key={$key}";
        $responseInphographic = Http::get($urlInphographic);

        if($responseInphographic->successful()){
            $dataInphographic = json_decode($responseInphographic->getBody(), true);
            $inphographicDataRaw = $dataInphographic['data'][1];
            foreach($inphographicDataRaw as $dt){
                $infografis[] = $dt;
            }
        }

        return view('landing', compact('strategicData', 'infografis'));
    }

    public function dynamic_table()
    {
        $key = '519fbdfe07dddde829aa7376bb2e985b';
        $domain = 3402;
        $page = 1;
        $perPage = 10; // Sesuaikan dengan jumlah data per halaman jika perlu
        $totalPages = 1; // Inisialisasi jumlah total halaman
        $allData = [];

        do {
            $url = "https://webapi.bps.go.id/v1/api/list/?key={$key}&model=subject&lang =ind&domain={$domain}&page={$page}";

            $response = Http::get($url);
            Log::info("Requesting page: {$page}"); // Log untuk debugging

            if ($response->successful()) {
                $data = json_decode($response->getBody(), true);

                // Ambil data dari array kedua
                $pageData = $data['data'][1];

                // Gabungkan data halaman ini dengan data sebelumnya
                $allData = array_merge($allData, $pageData);

                // Update total halaman
                $totalPages = $data['data'][0]['pages'];

                // Pindah ke halaman berikutnya
                $page++;
            } else {
                // Handle error response jika perlu
                Log::error("Failed to fetch page: {$page}");
                break; // Berhenti jika terjadi kesalahan
            }
        } while ($page <= $totalPages); // Teruskan hingga semua halaman terambil

        // Siapkan data untuk dropdown
        $dropdownData = [];
        foreach ($allData as $item) {
            if (isset($item['sub_id']) && isset($item['title'])) {
                Log::info("Processing item: {$item['sub_id']}"); // Log untuk debugging
                $dropdownData[] = [
                    'value' => $item['sub_id'],
                    'text' => $item['title']
                ];
            }
        }
        return view('dynamic_table', compact('dropdownData'));
    }
}
