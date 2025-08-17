export default function DestaquesTreinos({ historico }) {
    const calcularDestaques = () => {
        const exercicios = [...new Set(historico.map(item => item.exercicio))];
        return exercicios.map(exercicio => {
            const dadosExercicio = historico.filter(d => d.exercicio === exercicio);
            const maxCarga = Math.max(...dadosExercicio.map(d => d.carga));
            const progresso = dadosExercicio.length > 1 ?
                ((maxCarga - dadosExercicio[0].carga) / dadosExercicio[0].carga * 100).toFixed(1) : 0;

            return {
                exercicio,
                maxCarga,
                progresso,
                ultimaData: dadosExercicio[dadosExercicio.length - 1].data
            };
        });
    };

    const destaques = calcularDestaques();

    return (
        <div className="space-y-4">
            {destaques.map((destaque, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium">{destaque.exercicio}</h3>
                    <p className="text-sm text-gray-600">
                        Carga máxima: <span className="font-semibold">{destaque.maxCarga}kg</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Progresso: <span className={destaque.progresso >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {destaque.progresso}%
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Último treino: {new Date(destaque.ultimaData).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
}