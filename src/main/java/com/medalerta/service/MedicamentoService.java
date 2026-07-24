package com.medalerta.service;

import com.medalerta.model.Medicamento;
import com.medalerta.repository.MedicamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MedicamentoService {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    public List<Medicamento> findAll() {
        return medicamentoRepository.findAll();
    }

    public Optional<Medicamento> findById(Integer id) {
        return medicamentoRepository.findById(id);
    }

    public Medicamento save(Medicamento medicamento) {
        return medicamentoRepository.save(medicamento);
    }

    public void deleteById(Integer id) {
        medicamentoRepository.deleteById(id);
    }
}
