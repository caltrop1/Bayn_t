import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { publicContentService } from '../services/applicationService';

export default function PublicProgramDetails() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    publicContentService.program(id)
      .then(setProgram)
      .catch((requestError) => setError(requestError.message || 'Program could not be loaded.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-[560px] flex items-center justify-center text-gray-500">Loading program…</div>;

  if (error || !program) {
    return (
      <div className="min-h-[560px] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-gray-600">{error || 'Program not found.'}</p>
        <Link to="/programs" className="text-[#80651b] underline">Back to programs</Link>
      </div>
    );
  }

  const duration = program.duration_weeks ? `${program.duration_weeks} weeks` : 'Duration to be announced';
  const fee = program.tuition_fee ? `${program.tuition_fee} ${program.fee_currency || 'ETB'}` : 'Contact the academy';
  const intakes = program.intakes?.data || program.intakes || [];

  return (
    <main className="max-w-5xl mx-auto px-6 py-28 pb-20">
      <Link to="/programs" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to programs
      </Link>
      <section className="bg-[#f5f4ef] rounded-2xl overflow-hidden">
        <div className="h-64 sm:h-80 bg-[#e8e6dc]">
          <img src={program.image_url || '/hero.png'} alt={program.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#a67c4e] mb-3">{program.category || 'Academy program'} · {program.level || 'All levels'}</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1c1c1c] mb-5">{program.name}</h1>
          <p className="text-gray-600 leading-7 max-w-3xl">{program.description || 'Program information will be announced by the academy.'}</p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-lg p-4"><p className="text-xs text-gray-500">Duration</p><p className="font-medium mt-1">{duration}</p></div>
            <div className="bg-white rounded-lg p-4"><p className="text-xs text-gray-500">Tuition</p><p className="font-medium mt-1">{fee}</p></div>
            <div className="bg-white rounded-lg p-4"><p className="text-xs text-gray-500">Status</p><p className="font-medium mt-1 capitalize">{program.status || 'Open'}</p></div>
          </div>
          {intakes.length > 0 && (
            <div className="mt-8">
              <h2 className="font-serif text-2xl mb-3">Available intakes</h2>
              <div className="space-y-2">{intakes.map((intake) => <div key={intake.id} className="bg-white rounded-lg px-4 py-3 text-sm">{intake.name || intake.start_date || 'Upcoming intake'}</div>)}</div>
            </div>
          )}
          <Link to="/apply" className="inline-flex mt-8 bg-[#dfbe53] px-6 py-3 text-sm font-bold hover:bg-[#d4b044]">Apply for this program</Link>
        </div>
      </section>
    </main>
  );
}
