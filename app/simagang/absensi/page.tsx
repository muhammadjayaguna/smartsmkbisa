// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { Camera, MapPin, Clock, CheckCircle, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { compressImage } from '@/utils/imageCompression';
import { getLocalDateString } from '@/lib/utils';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Siswa {
  id: string;
  nama: string;
  nisn: string;
  rombel_id: string;
}

interface Rombel {
  id: string;
  nama_rombel: string;
  tahun_ajaran: string;
}

const AbsensiSiswaMagang = () => {
  const router = useRouter();
  const { isSiswa } = useUserRole();
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [selectedRombel, setSelectedRombel] = useState('');
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [activeTab, setActiveTab] = useState('datang');
  const [keterangan, setKeterangan] = useState('');
  const [kegiatanMagang, setKegiatanMagang] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRombel();
    getCurrentLocation();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchRombel = async () => {
    try {
      const { data, error } = await supabase
        .from('rombel')
        .select('id, nama_rombel, tahun_ajaran')
        .order('nama_rombel');

      if (error) throw error;
      setRombelList(data || []);
    } catch (error: any) {
      console.error('Error fetching rombel:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    }
  };

  const fetchSiswa = async (rombelId?: string) => {
    if (!rombelId) {
      setSiswaList([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('id, nama, nisn, rombel_id')
        .eq('rombel_id', rombelId)
        .order('nama');

      if (error) throw error;
      setSiswaList(data || []);
    } catch (error: any) {
      console.error('Error fetching siswa:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    }
  };

  // Fetch siswa when rombel changes
  useEffect(() => {
    fetchSiswa(selectedRombel);
    setSelectedSiswa(''); // Reset selected siswa when rombel changes
  }, [selectedRombel]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation tidak didukung di browser ini",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return;
    }

    console.log('Requesting high accuracy location...');

    // Enhanced location request with multiple attempts for better precision
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased timeout
      maximumAge: 0 // Always get fresh location
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;

        console.log('Location obtained:', {
          lat: latitude,
          lng: longitude,
          accuracy,
          altitude,
          heading,
          speed,
          timestamp: new Date(position.timestamp)
        });

        try {
          // Use Nominatim (OpenStreetMap) for reverse geocoding (free service)
          let address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'AbsensiSiswaMagang/1.0'
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                // Format address more nicely
                const parts = [];
                if (data.address) {
                  if (data.address.road) parts.push(data.address.road);
                  if (data.address.village || data.address.suburb) parts.push(data.address.village || data.address.suburb);
                  if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
                  if (data.address.state) parts.push(data.address.state);
                }
                address = parts.length > 0 ? parts.join(', ') : data.display_name;
              }
            }
          } catch (geocodeError) {
            console.log('Geocoding failed, using coordinates:', geocodeError);
          }

          // Add accuracy info to address
          const accuracyText = accuracy <= 10 ? 'Sangat Akurat' :
            accuracy <= 50 ? 'Akurat' :
              accuracy <= 100 ? 'Cukup Akurat' : 'Kurang Akurat';

          const fullAddress = `${address} (${accuracyText}: ±${accuracy?.toFixed(0)}m)`;

          setLocation({
            lat: latitude,
            lng: longitude,
            address: fullAddress
          });

          toast({
            title: "Lokasi Berhasil Didapat",
            description: `${accuracyText} dengan akurasi ±${accuracy?.toFixed(0)}m`,
          });

        } catch (error) {
          console.error('Error processing location:', error);
          const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)} (±${accuracy?.toFixed(0)}m)`;
          setLocation({
            lat: latitude,
            lng: longitude,
            address: address
          });

          toast({
            title: "Lokasi Didapat",
            description: `Akurasi: ±${accuracy?.toFixed(0)}m`,
          });
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Gagal mendapatkan lokasi.";
        let suggestion = "";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Izin lokasi ditolak.";
            suggestion = "Klik ikon lokasi di address bar dan izinkan akses lokasi.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Lokasi tidak dapat ditentukan.";
            suggestion = "Pastikan GPS aktif dan coba di area terbuka.";
            break;
          case error.TIMEOUT:
            errorMessage = "Waktu habis mendapatkan lokasi.";
            suggestion = "Jaringan lambat atau GPS lemah. Coba lagi.";
            break;
        }

        toast({
          title: "Error Lokasi",
          description: `${errorMessage} ${suggestion}`,
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      },
      locationOptions
    );

    // Try to get a more precise location after the first attempt
    setTimeout(() => {
      if (isLoadingLocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            if (accuracy < (location?.lng ? 50 : Infinity)) { // Update if more accurate
              console.log('Got more precise location:', { lat: latitude, lng: longitude, accuracy });
              setLocation(prev => prev ? {
                ...prev,
                lat: latitude,
                lng: longitude,
                address: prev.address.replace(/±\d+m/, `±${accuracy.toFixed(0)}m`)
              } : null);
            }
          },
          () => { }, // Ignore errors for second attempt
          locationOptions
        );
      }
    }, 5000);
  };

  const openCamera = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Close existing camera first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Set camera open FIRST so the video element renders
      setIsCameraOpen(true);

      // Request camera access with enhanced constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'user' },
          width: { min: 320, ideal: 1280, max: 1920 },
          height: { min: 240, ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted:', mediaStream.getVideoTracks()[0].getSettings());

      setStream(mediaStream);

      // Use setTimeout to ensure video element is rendered before assigning stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            videoRef.current?.play().catch(console.error);
          };

          videoRef.current.oncanplay = () => {
            console.log('Video can play');
          };

          videoRef.current.onerror = (e) => {
            console.error('Video error:', e);
          };

          // Ensure video plays
          videoRef.current.play().catch(err => {
            console.log('Auto-play failed, user interaction may be required:', err);
          });
        } else {
          console.error('Video ref not available after timeout');
        }
      }, 100);

      toast({
        title: "Kamera Aktif",
        description: "Kamera berhasil dibuka dan siap digunakan",
      });

    } catch (error: any) {
      console.error('Error accessing camera:', error);

      let errorMessage = "Gagal mengakses kamera.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Izin kamera ditolak. Klik ikon kamera di address bar dan izinkan akses kamera.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera yang berfungsi.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Kamera tidak mendukung kualitas yang diminta. Coba lagi.";
      } else if (error.message.includes('not supported')) {
        errorMessage = "Browser tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Firefox.";
      }

      toast({
        title: "Error Kamera",
        description: errorMessage,
        variant: "destructive",
      });

      // Reset camera state on error
      setIsCameraOpen(false);
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Error",
        description: "Video atau canvas tidak tersedia",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast({
        title: "Error",
        description: "Tidak dapat mengakses canvas context",
        variant: "destructive",
      });
      return;
    }

    // Enhanced video readiness check
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      toast({
        title: "Error",
        description: "Video belum siap. Tunggu hingga kamera aktif sepenuhnya.",
        variant: "destructive",
      });
      return;
    }

    // Get actual video dimensions
    const videoWidth = video.videoWidth || video.clientWidth || 640;
    const videoHeight = video.videoHeight || video.clientHeight || 480;

    console.log(`Capturing photo: ${videoWidth}x${videoHeight}`);

    // Set canvas to match video dimensions for high quality
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Clear canvas and draw video frame
    context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob with high quality
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rawFile = new File([blob], `absensi-${timestamp}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          console.log(`Photo captured: ${rawFile.size} bytes. Compressing...`);

          compressImage(rawFile).then(compressedFile => {
            setPhoto(compressedFile);
            setPhotoPreview(URL.createObjectURL(compressedFile));
            closeCamera();

            toast({
              title: "Foto Berhasil Diambil",
              description: `Ukuran: ${(compressedFile.size / 1024).toFixed(1)} KB (Dikompres)`,
            });
          });
        } else {
          throw new Error('Blob kosong atau tidak valid');
        }
      }, 'image/jpeg', 0.9); // Higher quality

    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Error",
        description: "Gagal menangkap gambar dari kamera",
        variant: "destructive",
      });
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Info",
        description: "Sedang mengompres foto...",
      });
      compressImage(file).then(compressedFile => {
        setPhoto(compressedFile);
        setPhotoPreview(URL.createObjectURL(compressedFile));
        toast({
          title: "Berhasil",
          description: `Foto dikompres: ${(compressedFile.size / 1024).toFixed(1)} KB`,
        });
      });
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      console.log('Starting photo upload:', { name: file.name, size: file.size, type: file.type });

      // Validate file size (max 10MB for better quality)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Ukuran file terlalu besar (maksimal 10MB)');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar');
      }

      // More robust file validation
      if (file.size === 0) {
        throw new Error('File kosong atau tidak valid');
      }

      // Generate unique filename with timestamp and user info
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `absensi-${timestamp}-${randomStr}.jpg`;

      console.log('Uploading to storage bucket: absensi-siswa-magang');

      // Upload with retry mechanism
      let uploadError = null;
      let uploadData = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error } = await supabase.storage
            .from('absensi-siswa-magang')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            });

          if (error) {
            uploadError = error;
            console.warn(`Upload attempt ${attempt} failed:`, error);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
              continue;
            }
          } else {
            uploadData = data;
            uploadError = null;
            break;
          }
        } catch (err) {
          uploadError = err;
          console.warn(`Upload attempt ${attempt} error:`, err);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      if (uploadError) {
        console.error('Final upload error:', uploadError);
        throw new Error(`Gagal upload setelah 3 percobaan: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('Upload berhasil tapi tidak ada data yang dikembalikan');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('absensi-siswa-magang')
        .getPublicUrl(fileName);

      console.log('Photo uploaded successfully:', publicUrl);

      // Verify the URL is accessible
      if (!publicUrl || !publicUrl.startsWith('http')) {
        throw new Error('URL foto tidak valid');
      }

      return publicUrl;

    } catch (error: any) {
      console.error('Error uploading photo:', error);
      throw new Error(error.message || 'Gagal mengupload foto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Starting form submission...');

    // Enhanced validation with specific error messages
    if (!selectedRombel) {
      toast({
        title: "Error Validasi",
        description: "Pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSiswa) {
      toast({
        title: "Error Validasi",
        description: "Pilih siswa terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Foto hanya wajib untuk absensi datang
    if (activeTab === 'datang' && !photo) {
      toast({
        title: "Error Validasi",
        description: "Foto wajib diambil untuk absensi datang",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Error Validasi",
        description: "Lokasi belum didapatkan. Coba refresh lokasi.",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for photo quality (only for datang)
    if (activeTab === 'datang' && photo && photo.size < 1000) { // Less than 1KB is probably corrupted
      toast({
        title: "Error Foto",
        description: "Foto tidak valid atau rusak. Ambil foto ulang.",
        variant: "destructive",
      });
      return;
    }

    // Check if student already has attendance for today
    try {
      const today = getLocalDateString();
      const { data: existingAbsensi, error: checkError } = await supabase
        .from('absensi_siswa_magang')
        .select('id, jenis_absensi')
        .eq('siswa_id', selectedSiswa)
        .eq('tanggal', today)
        .eq('jenis_absensi', activeTab === 'datang' ? 'masuk' : 'pulang');

      if (checkError) {
        console.error('Error checking existing attendance:', checkError);
        toast({
          title: "Error",
          description: "Gagal memeriksa data absensi yang sudah ada",
          variant: "destructive",
        });
        return;
      }

      if (existingAbsensi && existingAbsensi.length > 0) {
        const jenisText = activeTab === 'datang' ? 'datang' : 'pulang';
        toast({
          title: "Error",
          description: `Siswa sudah melakukan absensi ${jenisText} hari ini`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      toast({
        title: "Error",
        description: "Gagal memeriksa data absensi yang sudah ada",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo only for absensi datang
      if (activeTab === 'datang' && photo) {
        console.log('Uploading photo...');
        photoUrl = await uploadPhoto(photo);

        if (!photoUrl) {
          throw new Error('Gagal mendapatkan URL foto setelah upload');
        }
      }

      console.log('Inserting absensi record...');
      // Insert absensi record with better error handling
      const jenisAbsensiValue = activeTab === 'datang' ? 'masuk' : 'pulang';
      const keteranganValue = activeTab === 'datang'
        ? (keterangan.trim() || null)
        : (kegiatanMagang.trim() || null);

      const absensiData = {
        siswa_id: selectedSiswa,
        foto_url: photoUrl,
        lokasi_lat: parseFloat(location.lat.toFixed(6)),
        lokasi_lng: parseFloat(location.lng.toFixed(6)),
        alamat_lokasi: location.address,
        keterangan: keteranganValue,
        jenis_absensi: jenisAbsensiValue,
        status: 'hadir',
        tanggal: getLocalDateString(), // Today's date in local timezone
        waktu_absen: new Date().toISOString()
      };

      console.log('Absensi data to insert:', absensiData);

      const { data, error } = await Promise.race([
        supabase
          .from('absensi_siswa_magang')
          .insert(absensiData)
          .select('*'),
        new Promise<{ data: any; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout - operasi terlalu lama')), 30000)
        )
      ]);

      if (error) {
        console.error('Database insert error:', error);
        // Handle specific database errors
        if (error.code === '23505') {
          throw new Error('Data absensi sudah ada untuk siswa ini hari ini');
        } else if (error.code === '23503') {
          throw new Error('Data siswa tidak valid atau sudah dihapus');
        } else if (error.message.includes('timeout')) {
          throw new Error('Koneksi database timeout. Periksa koneksi internet.');
        } else {
          throw new Error(`Gagal menyimpan ke database: ${error.message}`);
        }
      }

      console.log('Absensi saved successfully:', data);

      const jenisText = activeTab === 'datang' ? 'datang' : 'pulang';
      toast({
        title: "✅ Berhasil!",
        description: `Absensi ${jenisText} berhasil disimpan`,
      });

      // Reset form state
      setSelectedRombel('');
      setSelectedSiswa('');
      setKeterangan('');
      setKegiatanMagang('');
      setPhoto(null);
      setPhotoPreview(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh location for next attendance
      setTimeout(() => {
        getCurrentLocation();
      }, 1000);

    } catch (error: any) {
      console.error('Error submitting absensi:', error);

      let errorMessage = "Gagal menyimpan absensi";
      if (error.message.includes('upload')) {
        errorMessage = "Gagal mengupload foto. Periksa koneksi internet.";
      } else if (error.message.includes('database')) {
        errorMessage = "Gagal menyimpan ke database. Coba lagi.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Koneksi timeout. Periksa koneksi internet dan coba lagi.";
      } else if (error.message.includes('sudah ada')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Gagal Menyimpan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTime = new Date().toLocaleString('id-ID');

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <PageBreadcrumb currentPage="Absensi Siswa Magang" className="mb-4" />

          {/* Tabs untuk Absensi Datang dan Pulang */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="datang" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Absensi Datang
              </TabsTrigger>
              <TabsTrigger value="pulang" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Absensi Pulang
              </TabsTrigger>
            </TabsList>

            <TabsContent value="datang">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Form Section - Datang */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LogIn className="h-5 w-5 text-green-600" />
                      Form Absensi Datang
                    </CardTitle>
                    <CardDescription>
                      Waktu saat ini: {currentTime}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="rombel-datang">Pilih Kelas</Label>
                        <Select value={selectedRombel} onValueChange={setSelectedRombel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kelas terlebih dahulu" />
                          </SelectTrigger>
                          <SelectContent>
                            {rombelList.map((rombel) => (
                              <SelectItem key={rombel.id} value={rombel.id}>
                                {rombel.nama_rombel} - {rombel.tahun_ajaran}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="siswa-datang">Pilih Siswa</Label>
                        <Select
                          value={selectedSiswa}
                          onValueChange={setSelectedSiswa}
                          disabled={!selectedRombel}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedRombel ? "Pilih siswa" : "Pilih kelas dulu"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {siswaList.map((siswa) => (
                              <SelectItem key={siswa.id} value={siswa.id}>
                                {siswa.nama} - {siswa.nisn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keterangan-datang">Keterangan (Opsional)</Label>
                        <Textarea
                          id="keterangan-datang"
                          value={keterangan}
                          onChange={(e) => setKeterangan(e.target.value)}
                          placeholder="Tambahkan keterangan jika diperlukan..."
                          rows={3}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || !photo || !location || !selectedSiswa}
                      >
                        {isSubmitting ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan Absensi Datang'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Camera & Location Section - Datang */}
                <div className="space-y-6">
                  {/* Camera Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Ambil Foto
                      </CardTitle>
                      <CardDescription>
                        Foto wajib untuk verifikasi kehadiran
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!isCameraOpen && !photoPreview && (
                        <div className="space-y-2">
                          <Button onClick={openCamera} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            Buka Kamera
                          </Button>
                        </div>
                      )}

                      {isCameraOpen && (
                        <div className="space-y-4">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full rounded-lg border"
                            style={{ maxHeight: '300px' }}
                          />
                          <div className="flex gap-2">
                            <Button onClick={capturePhoto} className="flex-1">
                              Ambil Foto
                            </Button>
                            <Button onClick={closeCamera} variant="outline">
                              Tutup
                            </Button>
                          </div>
                        </div>
                      )}

                      {photoPreview && (
                        <div className="space-y-4">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full rounded-lg border"
                            style={{ maxHeight: '300px', objectFit: 'cover' }}
                          />
                          <Button
                            onClick={() => {
                              setPhoto(null);
                              setPhotoPreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Ambil Ulang
                          </Button>
                        </div>
                      )}

                      <canvas ref={canvasRef} className="hidden" />
                    </CardContent>
                  </Card>

                  {/* Location Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Lokasi Absensi
                      </CardTitle>
                      <CardDescription>
                        Lokasi otomatis terdeteksi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLocation ? (
                        <div className="flex items-center justify-center py-8">
                          <CheckCircle className="h-6 w-6 animate-spin mr-2" />
                          Mendapatkan lokasi...
                        </div>
                      ) : location ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">{location.address}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={getCurrentLocation}
                            className="w-full"
                            disabled={isLoadingLocation}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Refresh Lokasi
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/20 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">Lokasi belum didapatkan</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={getCurrentLocation}
                            className="w-full"
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Dapatkan Lokasi
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pulang">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Form Section - Pulang */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LogOut className="h-5 w-5 text-orange-600" />
                      Form Absensi Pulang
                    </CardTitle>
                    <CardDescription>
                      Waktu saat ini: {currentTime}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="rombel-pulang">Pilih Kelas</Label>
                        <Select value={selectedRombel} onValueChange={setSelectedRombel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kelas terlebih dahulu" />
                          </SelectTrigger>
                          <SelectContent>
                            {rombelList.map((rombel) => (
                              <SelectItem key={rombel.id} value={rombel.id}>
                                {rombel.nama_rombel} - {rombel.tahun_ajaran}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="siswa-pulang">Pilih Siswa</Label>
                        <Select
                          value={selectedSiswa}
                          onValueChange={setSelectedSiswa}
                          disabled={!selectedRombel}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedRombel ? "Pilih siswa" : "Pilih kelas dulu"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {siswaList.map((siswa) => (
                              <SelectItem key={siswa.id} value={siswa.id}>
                                {siswa.nama} - {siswa.nisn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kegiatan-magang">Kegiatan Magang</Label>
                        <Textarea
                          id="kegiatan-magang"
                          value={kegiatanMagang}
                          onChange={(e) => setKegiatanMagang(e.target.value)}
                          placeholder="Tuliskan kegiatan magang yang dilakukan hari ini..."
                          rows={4}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || !location || !selectedSiswa}
                      >
                        {isSubmitting ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan Absensi Pulang'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Location Section - Pulang */}
                <div className="space-y-6">
                  {/* Location Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Lokasi Absensi
                      </CardTitle>
                      <CardDescription>
                        Lokasi otomatis terdeteksi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLocation ? (
                        <div className="flex items-center justify-center py-8">
                          <CheckCircle className="h-6 w-6 animate-spin mr-2" />
                          Mendapatkan lokasi...
                        </div>
                      ) : location ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">{location.address}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={getCurrentLocation}
                            className="w-full"
                            disabled={isLoadingLocation}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Refresh Lokasi
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/20 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">Lokasi belum didapatkan</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={getCurrentLocation}
                            className="w-full"
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            Dapatkan Lokasi
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AbsensiSiswaMagang;